import React, { useState, useEffect } from "react";
import { Table, Tag, Typography, Alert, Card } from "antd";
import { getAllTransactions } from "../services/api";

const { Title } = Typography;

// Helper untuk format Rupiah
const formatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

const TransactionsPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State Pagination
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchTransactions = async (page, pageSize) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllTransactions(page, pageSize);
      const result = response.data.data;

      setData(result.data);
      setPagination({
        current: result.current_page,
        pageSize: pageSize, // Gunakan pageSize dari parameter
        total: result.total_items,
      });
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError("Gagal memuat data transaksi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(pagination.current, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Hanya dijalankan saat mount

  // Handler saat tabel berubah (ganti halaman)
  const handleTableChange = (newPagination) => {
    fetchTransactions(newPagination.current, newPagination.pageSize);
  };

  const columns = [
    {
      title: "ID Transaksi",
      dataIndex: "transaction_id",
      key: "transaction_id",
      render: (text) => (
        <span style={{ fontSize: "12px", color: "#888" }}>
          {text.substring(0, 8)}...
        </span>
      ),
    },
    {
      title: "Tanggal",
      dataIndex: "transaction_date",
      key: "transaction_date",
      render: (date) =>
        new Date(date).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
    },
    {
      title: "Tipe",
      dataIndex: "transaction_type",
      key: "transaction_type",
      render: (type) => (
        <Tag color={type === "Jasa" ? "blue" : "orange"}>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    // {
    //   title: "Konteks",
    //   dataIndex: "context_info",
    //   key: "context_info",
    // },
    {
      title: "Pembayar",
      dataIndex: "payer_name",
      key: "payer_name",
    },
    {
      title: "Jumlah",
      dataIndex: "amount_paid",
      key: "amount_paid",
      align: "right",
      render: (amount) => <b>{formatter.format(amount)}</b>,
    },
    {
      title: "Metode",
      dataIndex: "payment_method",
      key: "payment_method",
      render: (method) => (method ? method.toUpperCase() : "-"),
    },
    // {
    //     title: 'Status',
    //     dataIndex: 'status',
    //     key: 'status',
    //     render: (status) => {
    //         let color = 'default';
    //         if (status === 'paid' || status === 'Paid') color = 'success';
    //         if (status === 'pending') color = 'warning';
    //         if (status === 'failed') color = 'error';
    //         return <Tag color={color}>{status ? status.toUpperCase() : 'UNKNOWN'}</Tag>;
    //     },
    // },
  ];

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Title level={3}>Riwayat Transaksi</Title>
      </div>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Table
        columns={columns}
        dataSource={data}
        rowKey="transaction_id"
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        bordered
        scroll={{ x: 800 }} // Agar tabel bisa di-scroll horizontal di layar kecil
      />
    </Card>
  );
};

export default TransactionsPage;
