import { useState, useEffect } from "react";
import axios from "axios";

const Chat = () => {
    const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
    const [input, setInput] = useState("");
    const [sessionId, setSessionId] = useState<string>("");

    // Fungsi untuk membuat session_id acak (numeric + string)
    const generateSessionId = () => {
        const randomId = Math.floor(Math.random() * 1000000); // Angka acak
        return `user-session-${randomId}`;
    };

    // Fungsi untuk mengambil riwayat percakapan berdasarkan session_id
    const getChatHistory = async (sessionId: string) => {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/api/chat/history/${sessionId}`);
            setMessages(response.data.history || []);
        } catch (error) {
            console.error("Error fetching chat history:", error);
        }
    };

    // Kirim pesan ke API
    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { role: "user", content: input };
        const processingMessage = { role: "bot", content: "Permintaan sedang diproses..." };

        setMessages((prev) => [...prev, userMessage, processingMessage]);

        setInput("");

        try {
            const response = await axios.post("http://127.0.0.1:8000/api/chat", {
                message: input,
                session_id: sessionId,
            });

            console.log("API Response:", response.data); // Debug log

            setMessages((prev) => [
                ...prev.slice(0, -1), // Hapus "Permintaan sedang diproses..."
                { role: "bot", content: response.data.response },
            ]);
        } catch (error: any) {
            console.error("Error sending message:", error);

            const errorMessage = error.response?.data?.error || "Terjadi kesalahan yang tidak diketahui.";
            const errorDetails = error.response?.data?.details
                ? JSON.stringify(error.response?.data?.details)
                : "Tidak ada detail.";

            setMessages((prev) => [
                ...prev.slice(0, -1), // Hapus "Permintaan sedang diproses..."
                { role: "bot", content: `⚠️ Error: ${errorMessage}\n📄 Details: ${errorDetails}` },
            ]);
        }
    };

    // Handle session_id selection
    const handleSessionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedSessionId = e.target.value;
        setSessionId(selectedSessionId);
        getChatHistory(selectedSessionId); // Menampilkan riwayat percakapan berdasarkan session_id
    };

    // Fungsi untuk memulai percakapan baru dengan session_id acak
    const startNewSession = () => {
        const newSessionId = generateSessionId();
        setSessionId(newSessionId);
        setMessages([]); // Reset pesan saat percakapan baru dimulai
    };

    return (
        <div className="vh-100 d-flex flex-column">
            <div className="row flex-fill g-0">
                {/* Sidebar */}
                <div className="col-12 col-md-3 bg-light p-3">
                    <div className="d-flex justify-content-between mb-3">
                        <div className="fw-bold">ChatGPT</div>
                        <button className="btn btn-outline-secondary" onClick={startNewSession}>
                            Start New Session
                        </button>
                    </div>

                    <div className="mt-2">
                        <label>Select Session: </label>
                        <select
                            className="form-select"
                            value={sessionId}
                            onChange={handleSessionChange}
                        >
                            <option value="">-- Choose a session --</option>
                            {/* You can dynamically load session ids here */}
                            <option value="user-session-123">user-session-123</option>
                            <option value="user-session-456">user-session-456</option>
                        </select>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="col-12 col-md-9 d-flex flex-column">
                    {/* Chat History */}
                    <div
                        className="flex-fill overflow-auto px-5 pt-5"
                        style={{
                            minHeight: "300px",  // Pastikan ada ruang minimum untuk area chat
                            maxHeight: "calc(100vh - 50px)",  // Membatasi tinggi chat agar responsif
                            overflowX: "hidden", // Menghindari scrollbar horizontal
                            display: "flex",
                            flexDirection: "column",  // Membuat pesan tampil vertikal
                            justifyContent: messages.length > 0 ? "flex-start" : "center",  // Posisikan pesan di tengah jika belum ada
                            paddingBottom: "50px", // Menambahkan padding bawah agar input tidak tertutup pesan
                        }}
                    >
                        {/* Jika tidak ada pesan, tampilkan pesan default */}
                        {messages.length === 0 ? (
                            <div className="text-center text-muted">
                                <p>No messages yet. Chat with ChatGPT!</p>
                            </div>
                        ) : (
                            messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`d-flex ${msg.role === "user" ? "justify-content-end" : "justify-content-start"}`}
                                >
                                    <div
                                        className={`alert ${msg.role === "user" ? "alert-secondary" : "alert-light"} p-2 mb-3`}
                                        style={{
                                            maxWidth: "70%",  // Maksimalkan lebar 70% untuk pesan
                                            wordWrap: "break-word",  // Memastikan kata panjang tidak memanjang
                                            whiteSpace: "pre-wrap",  // Menjaga format teks (termasuk baris baru)
                                        }}
                                    >
                                        <strong>{msg.role === "user" ? "" : "ChatGPT"}</strong>
                                        {msg.role === "bot" && <br />}
                                        {msg.content}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Input Message */}
                    <div className="mt-auto">
                        <div className="input-group">
                            <input
                                type="text"
                                className="form-control"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your message..."
                            />
                            <button className="btn btn-secondary" onClick={sendMessage}>
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;
