import React, { useState, useEffect } from 'react';
import { Table, Spin, Alert, Button, Modal, Upload, message, Typography, Tag } from 'antd';
import { UploadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { getPendingPayouts, markPayoutAsCompleted } from '../services/api';

const { Title, Text } = Typography;

// Helper untuk format Rupiah
const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
});

const PayoutsPage = () => {
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State untuk Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPayout, setSelectedPayout] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [uploading, setUploading] = useState(false);

    // Fungsi untuk mengambil data
    const fetchPayouts = async () => {
        try {
            setLoading(true);
            const response = await getPendingPayouts();
            setPayouts(response.data.data);
        // eslint-disable-next-line no-unused-vars
        } catch (err) {
            setError('Gagal memuat data payout.');
        } finally {
            setLoading(false);
        }
    };

    // Ambil data saat komponen pertama kali dimuat
    useEffect(() => {
        fetchPayouts();
    }, []);

    // --- Modal Handlers ---

    const showModal = (payout) => {
        setSelectedPayout(payout);
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setSelectedPayout(null);
        setFileList([]); // Kosongkan file list
    };

    const handleCompletePayout = async () => {
        if (fileList.length === 0) {
            message.error('Silakan unggah bukti transfer terlebih dahulu.');
            return;
        }

        const formData = new FormData();
        formData.append('transfer_proof_file', fileList[0]);

        setUploading(true);
        try {
            await markPayoutAsCompleted(selectedPayout.payout_id, formData);
            message.success(`Payout untuk ${ selectedPayout.payee_name } berhasil diselesaikan.`);
            handleCancel(); // Tutup modal
            fetchPayouts(); // Muat ulang data tabel
        // eslint-disable-next-line no-unused-vars
        } catch (err) {
            message.error('Gagal menyelesaikan payout.');
        } finally {
            setUploading(false);
        }
    };

    // Props untuk komponen Upload
    const uploadProps = {
        onRemove: () => setFileList([]),
        beforeUpload: (file) => {
            // Hanya izinkan satu file
            setFileList([file]);
            // Kembalikan false untuk mencegah upload otomatis
            return false;
        },
        fileList,
    };

    // Definisi kolom untuk tabel
    const columns = [
        {
            title: 'Nama Penerima',
            dataIndex: 'payee_name',
            key: 'payee_name',
        },
        {
            title: 'Peran',
            dataIndex: 'payee_type',
            key: 'payee_type',
            render: (type) => (
                <Tag color={type === 'worker' ? 'blue' : 'green'}>{type.toUpperCase()}</Tag>
            ),
        },
        {
            title: 'Jumlah',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount) => formatter.format(amount),
        },
        {
            title: 'Info Bank',
            key: 'bank',
            render: (_, record) => (
                <div>
                    <Text strong>{record.bank_name}</Text><br />
                    <Text>{record.bank_account_number}</Text><br />
                    <Text type="secondary">{record.bank_account_holder}</Text>
                </div>
            ),
        },
        {
            title: 'Konteks',
            dataIndex: 'context_title',
            key: 'context_title',
        },
        {
            title: 'Aksi',
            key: 'action',
            render: (_, record) => (
                <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => showModal(record)}
                >
                    Bayar
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
            <Title level={3} style={{ marginBottom: 24 }}>Manajemen Payout</Title>
            <Table
                columns={columns}
                dataSource={payouts}
                rowKey="payout_id"
                bordered
            />

            {/* Modal untuk Konfirmasi Pembayaran */}
            {selectedPayout && (
                <Modal
                    title={`Konfirmasi Payout: ${ selectedPayout.payee_name }`}
                    open={isModalOpen}
                    onCancel={handleCancel}
                    footer={[
                        <Button key="back" onClick={handleCancel}>
                            Batal
                        </Button>,
                        <Button
                            key="submit"
                            type="primary"
                            loading={uploading}
                            onClick={handleCompletePayout}
                        >
                            Tandai Selesai & Kirim Bukti
                        </Button>,
                    ]}
                >
                    <p>Anda akan menandai payout sebesar <strong>{formatter.format(selectedPayout.amount)}</strong> sebagai selesai.</p>
                    <p>Silakan unggah bukti transfer Anda (JPG/PNG).</p>
                    <Upload {...uploadProps}>
                        <Button icon={<UploadOutlined />}>Pilih File Bukti Transfer</Button>
                    </Upload>
                </Modal>
            )}
        </>
    );
};

export default PayoutsPage;