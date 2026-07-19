import React, { useState, useEffect } from 'react';
import { Table, Spin, Alert, Button, Modal, Image, Radio, Input, Form, message, Typography, Tag } from 'antd';
import { SafetyCertificateOutlined } from '@ant-design/icons';
import { getPendingVerifications, reviewVerification } from '../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

const VerificationsPage = () => {
    // [PERBAIKAN 1] Inisialisasi state sebagai array kosong
    const [verifications, setVerifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State untuk Modal
    const [form] = Form.useForm(); // Form hook untuk modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVerification, setSelectedVerification] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fungsi untuk mengambil data
    const fetchVerifications = async () => {
        try {
            setLoading(true);
            const response = await getPendingVerifications();
            // [PERBAIKAN 2] Pastikan data yang disetel selalu array, bahkan jika API mengembalikan null
            setVerifications(response.data.data || []);
            // eslint-disable-next-line no-unused-vars
        } catch (err) {
            setError('Gagal memuat data verifikasi.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVerifications();
    }, []);

    // --- Modal Handlers ---

    const showModal = (record) => {
        setSelectedVerification(record);
        form.setFieldsValue({ status: 'approved', notes: '' }); // Reset form
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setSelectedVerification(null);
        form.resetFields();
    };

    const handleSubmitReview = async (values) => {
        // Validasi: Catatan wajib diisi jika ditolak
        if (values.status === 'rejected' && (!values.notes || values.notes.trim() === '')) {
            message.error('Catatan wajib diisi jika verifikasi ditolak.');
            return;
        }

        setIsSubmitting(true);
        try {
            // [PERBAIKAN 3] Gunakan optional chaining untuk memastikan ID ada sebelum dipanggil
            await reviewVerification(selectedVerification?.id, values);
            message.success('Verifikasi berhasil diproses.');
            handleCancel(); // Tutup modal
            fetchVerifications(); // Muat ulang data tabel
            // eslint-disable-next-line no-unused-vars
        } catch (err) {
            message.error('Gagal memproses verifikasi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Definisi kolom untuk tabel
    const columns = [
        {
            title: 'Nama Pengguna',
            dataIndex: ['User', 'Name'],
            key: 'userName',
            // [PERBAIKAN 4] Tambahkan render function defensif
            render: (text, record) => record.User?.Name || 'Data Hilang',
        },
        {
            title: 'Peran',
            dataIndex: ['User', 'Role'],
            key: 'userRole',
            render: (text, record) => record.User?.Role || 'N/A',
        },
        {
            title: 'Tipe Dokumen',
            dataIndex: 'DocumentType',
            key: 'DocumentType',
            render: (type) => <Tag color="cyan">{type.toUpperCase()}</Tag>,
        },
        {
            title: 'Tanggal Diunggah',
            dataIndex: 'CreatedAt',
            key: 'CreatedAt',
            render: (date) => new Date(date).toLocaleString('id-ID'),
        },
        {
            title: 'Aksi',
            key: 'action',
            render: (_, record) => (
                <Button
                    type="primary"
                    icon={<SafetyCertificateOutlined />}
                    onClick={() => showModal(record)}
                >
                    Tinjau
                </Button>
            ),
        },
    ];

    if (loading) {
        return <Spin size="large" style={{ display: 'block', marginTop: 50 }} />;
    }

    if (error) {
        return <Alert message="Error" description={error} type="error" showIcon />;
    }

    return (
        <>
            <Title level={3} style={{ marginBottom: 24 }}>Verifikasi Dokumen</Title>
            <Table
                columns={columns}
                dataSource={verifications} // Ini selalu array (perbaikan 2)
                rowKey="id"
                loading={loading}
                bordered
            />

            {/* Modal untuk Meninjau Dokumen */}
            {selectedVerification && (
                <Modal
                    // [PERBAIKAN 5] Gunakan optional chaining di Modal Title
                    title={`Tinjau: ${ selectedVerification.DocumentType } - ${ selectedVerification.User?.Name || 'N/A' }`}
                    open={isModalOpen}
                    onCancel={handleCancel}
                    footer={[
                        <Button key="back" onClick={handleCancel}>
                            Batal
                        </Button>,
                        <Button
                            key="submit"
                            type="primary"
                            loading={isSubmitting}
                            onClick={() => form.submit()} // Memicu onFinish
                        >
                            Simpan Keputusan
                        </Button>,
                    ]}
                >
                    <Title level={5}>Dokumen</Title>
                    <Image
                        width="100%"
                        src={selectedVerification.FilePath}
                        alt={`Dokumen ${ selectedVerification.DocumentType }`}
                    />
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmitReview}
                        style={{ marginTop: 24 }}
                    >
                        <Form.Item
                            name="status"
                            label="Keputusan"
                            rules={[{ required: true }]}
                        >
                            <Radio.Group>
                                <Radio.Button value="approved">Setujui</Radio.Button>
                                <Radio.Button value="rejected">Tolak</Radio.Button>
                            </Radio.Group>
                        </Form.Item>
                        <Form.Item
                            name="notes"
                            label="Catatan (Wajib jika ditolak)"
                        >
                            <TextArea rows={3} placeholder="Contoh: Foto KTP buram, silakan unggah ulang." />
                        </Form.Item>
                    </Form>
                </Modal>
            )}
        </>
    );
};

export default VerificationsPage;