import { useState, useEffect } from "react";
import axios from "axios";

const Chat = () => {
    const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
    const [input, setInput] = useState("");
    const [sessionId, setSessionId] = useState<string>("");
    const [availableSessions, setAvailableSessions] = useState<string[]>([]); // Menyimpan session_id yang tersedia
    const [loading, setLoading] = useState<boolean>(false); // State untuk loader

    // Fungsi untuk membuat session_id acak (numeric + string)
    const generateSessionId = () => {
        const randomId = Math.floor(Math.random() * 1000000); // Angka acak
        return `user-session-${randomId}`;
    };

    // Fungsi untuk mengambil daftar session_id yang tersedia
    const getAvailableSessions = async () => {
        setLoading(true);  // Menampilkan loader saat memuat
        try {
            const response = await axios.get("http://127.0.0.1:8000/api/chat/sessions");
            console.log("Available Sessions:", response.data);
            setAvailableSessions(response.data.session_ids || []);
        } catch (error) {
            console.error("Error fetching available sessions:", error);
        } finally {
            setLoading(false); // Sembunyikan loader setelah memuat
        }
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

    const formatMessage = (msg: string) => {
        return msg
            .replace(/```([a-zA-Z]*)\n([\s\S]*?)```/g, "<pre class='code-block'><code>$2</code></pre>") // Kode block
            .replace(/`([^`]+)`/g, "<code class='inline-code'>$1</code>")  // Inline code
            .replace(/###(.*?)###/g, "<strong>$1</strong>")  // Teks yang diapit oleh ###
            .replace(/##(.*?)##/g, "<strong>$1</strong>");  // Teks yang diapit oleh ##
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

            console.log("API Response:", response.data);
            setMessages((prev) => [
                ...prev.slice(0, -1),
                { role: "bot", content: formatMessage(response.data.response) },
            ]);
        } catch (error: any) {
            console.error("Error sending message:", error);

            const errorMessage = error.response?.data?.error || "Terjadi kesalahan yang tidak diketahui.";
            const errorDetails = error.response?.data?.details
                ? JSON.stringify(error.response?.data?.details)
                : "Tidak ada detail.";

            setMessages((prev) => [
                ...prev.slice(0, -1),
                { role: "bot", content: `⚠️ Error: ${errorMessage}\n📄 Details: ${errorDetails}` },
            ]);
        }
    };

    // Handle session_id selection
    const handleSessionChange = (sessionId: string) => {
        setSessionId(sessionId);
        getChatHistory(sessionId);
    };

    // Fungsi untuk memulai percakapan baru dengan session_id acak
    const startNewSession = () => {
        const newSessionId = generateSessionId();
        setSessionId(newSessionId);
        setMessages([]); // Reset pesan saat percakapan baru dimulai
    };

    // Mengambil daftar session saat komponen dimuat
    useEffect(() => {
        getAvailableSessions();
    }, []);

    // Reload daftar session setiap kali ada perubahan pada sessionId
    useEffect(() => {
        if (sessionId) {
            getAvailableSessions();  // Reload session list jika ada perubahan
        }
    }, [sessionId]);

    // Fungsi untuk menangani tekan tombol Enter
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();  // Mencegah Enter menghasilkan line break
            sendMessage();  // Panggil sendMessage jika Enter ditekan
        }
    };

    return (
        <div className="vh-100 d-flex flex-column">
            <div className="row flex-fill g-0">
                {/* Sidebar */}
                <div className="col-12 col-md-3 bg-light p-3">
                    <div className="d-flex justify-content-between mb-3">
                        <div className="fw-bold">R GPT</div>
                        <button className="btn btn-outline-secondary" onClick={startNewSession}>
                            Start New Session
                        </button>
                    </div>

                    <div className="mt-2">
                        {/* Loader */}
                        {loading ? (
                            <div className="text-center">
                                <img
                                    src="https://retchhh.wordpress.com/wp-content/uploads/2015/03/loading1.gif"
                                    alt="Loading..."
                                    style={{ width: "50px", height: "50px" }}
                                />
                            </div>
                        ) : (
                            <div>
                                <div className="fw-bold mb-2">Sessions</div>
                                {/* List session_id yang tersedia */}
                                {availableSessions.length === 0 ? (
                                    <div>No sessions available</div>
                                ) : (
                                    <ul className="list-group">
                                        {availableSessions.map((session) => (
                                            <li
                                                key={session}
                                                className={`list-group-item mb-2 ${sessionId === session ? "bg-secondary text-white" : ""
                                                    }`}
                                                onClick={() => handleSessionChange(session)}
                                                style={{
                                                    cursor: "pointer",
                                                    border: "1px solid #ddd",
                                                    borderRadius: "5px",
                                                }}
                                            >
                                                {session}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="col-12 col-md-9 d-flex flex-column">
                    {/* Chat History */}
                    <div
                        className="flex-fill overflow-auto px-5 pt-5"
                        style={{
                            minHeight: "300px",
                            maxHeight: "calc(100vh - 50px)",
                            overflowX: "hidden",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: messages.length > 0 ? "flex-start" : "center",
                            paddingBottom: "50px",
                        }}
                    >
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
                                            maxWidth: "70%",
                                            wordWrap: "break-word",
                                            whiteSpace: "pre-wrap",
                                        }}
                                    >
                                        <strong>{msg.role === "user" ? "" : "AI"}</strong>
                                        {msg.role === "bot" && <br />}
                                        <span
                                            dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                                        />
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
                                onKeyDown={handleKeyDown}  // Menambahkan event handler untuk Enter
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
