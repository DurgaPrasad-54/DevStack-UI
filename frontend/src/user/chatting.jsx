import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { BiSidebar } from "react-icons/bi";
import axios from 'axios';
import './chatting.css';
import config from '../config';

const ChatApp = () => {
    const [users, setUsers] = useState([]);
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [message, setMessage] = useState('');
    const [connectionError, setConnectionError] = useState(null);
    const [showSidebar, setShowSidebar] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUserName, setSelectedUserName] = useState('');
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const token = localStorage.getItem('token');
    const [shouldFetchChats, setShouldFetchChats] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [updated, setUpdated] = useState(null);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

    // Add a check for mobile view
    useEffect(() => {
        const checkMobileView = () => {
            setIsMobileView(window.innerWidth <= 768);
        };

        window.addEventListener('resize', checkMobileView);
        return () => window.removeEventListener('resize', checkMobileView);
    }, []);

    const handleNewMessage = (data) => {
        setChats(prevChats => {
            return prevChats.map(chat => {
                if (chat._id === data.chatId) {
                    const updatedChat = {
                        ...chat,
                        messages: [...(chat.messages || []), data.message],
                        lastMessage: new Date()
                    };
                    if (selectedChat && selectedChat._id === data.chatId) {
                        setSelectedChat(updatedChat);
                    }
                    return updatedChat;
                }
                return chat;
            });
        });

        setUpdated(new Date().getTime());

        if (selectedChat && selectedChat._id === data.chatId) {
            fetchChats();
        }
    };

    useEffect(() => {
        if (!socketRef.current) {
            socketRef.current = io(`${config.backendUrl}`, {
                auth: { token },
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });

            socketRef.current.on('connect', () => {
                console.log('Connected to socket server');
                setConnectionError(null);
            });

            socketRef.current.on('newMessage', handleNewMessage);

            socketRef.current.on('error', (error) => {
                console.error('Socket error:', error);
                setConnectionError('Chat server error occurred');
            });

            socketRef.current.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
                setConnectionError('Failed to connect to chat server');
            });
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.off('newMessage');
                socketRef.current.close();
                socketRef.current = null;
            }
        };
    }, [token]);

    useEffect(() => {
        if (updated) {
            fetchChats();
        }
    }, [updated]);

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${config.backendUrl}/chat/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    useEffect(() => {
        fetchChats();
    }, []);

    const fetchChats = async () => {
        try {
            const response = await axios.get(`${config.backendUrl}/chat/conversations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setChats(response.data);

            if (selectedChat) {
                const updatedChat = response.data.find(chat => chat._id === selectedChat._id);
                if (updatedChat) {
                    setSelectedChat(updatedChat);
                }
            }
        } catch (error) {
            console.error('Error fetching chats:', error);
        }
    };

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            await Promise.all([
                fetchUsers(),
                fetchChats()
            ]);
        } catch (error) {
            console.error('Error fetching initial data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, [token]);

    const selectUser = async (user) => {
        try {
            const capitalizedRole = user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();
            const response = await axios.post(
                `${config.backendUrl}/chat/conversation`,
                {
                    targetUserId: user._id,
                    targetUserModel: capitalizedRole
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            setSelectedChat(response.data);
            setSelectedUserName(user.name);
            
            if (isMobileView) {
                setShowSidebar(false);
            }
        } catch (error) {
            console.error('Error selecting user:', error);
        }
    };

    const sendMessage = async () => {
        if (!message.trim() || !selectedChat || !socketRef.current) return;

        try {
            const userId = JSON.parse(atob(token.split('.')[1])).userId;
            const userRole = JSON.parse(atob(token.split('.')[1])).role;
            const capitalizedRole = userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase();

            const newMessage = {
                sender: userId,
                senderModel: capitalizedRole,
                content: message,
                timestamp: new Date()
            };

            setSelectedChat(prev => ({
                ...prev,
                messages: [...prev.messages, newMessage]
            }));
            
            setMessage('');

            socketRef.current.emit('sendMessage', {
                chatId: selectedChat._id,
                message: {
                    content: message
                }
            });

        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(scrollToBottom, [selectedChat?.messages]);

    const toggleSidebar = () => {
        setShowSidebar(!showSidebar);
    };

    if (isLoading) {
        return <div className="loading">Loading chat...</div>;
    }

    return (
        <div className="chat-container">
            {/* People Container Toggle Button */}
            {isMobileView && !selectedChat && (
                <button onClick={toggleSidebar} className="toggle-sidebar-btn people-toggle">
                    <BiSidebar size={24} />
                </button>
            )}

            {/* Chat Container Toggle Button */}
            {isMobileView && selectedChat && (
                <button onClick={toggleSidebar} className="toggle-sidebar-btn chat-toggle">
                    <BiSidebar size={24} />
                </button>
            )}

            <div className={`sidebars ${showSidebar ? 'show' : 'hide'}`}>
                <div className="search-bar">
                    <div className="search-input-container">
                        <input
                            type="text"
                            placeholder="Search"
                            className="search-input-chat"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="people-section">
                    <h2 className="section-title">People</h2>
                    {searchTerm ? (
                        filteredUsers.length > 0 ? (
                            filteredUsers.map(user => (
                                <div
                                    key={user._id}
                                    className="user-item"
                                    onClick={() => selectUser(user)}
                                >
                                    <div className="user-icon">👤</div>
                                    <span className="user-name">{user.name}</span>
                                </div>
                            ))
                        ) : (
                            <p>No students found</p>
                        )
                    ) : (
                        users.map(user => (
                            <div
                                key={user._id}
                                className="user-item"
                                onClick={() => selectUser(user)}
                            >
                                <div className="user-icon">👤</div>
                                <span className="user-name">{user.name}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className={`chat-area ${!showSidebar ? 'expanded' : ''}`}>
                {connectionError && (
                    <div className="error-message">{connectionError}</div>
                )}
                
                {selectedChat ? (
                    <>
                        <div className="chat-header">
                            <div className="chat-header-user">
                                <div className="chat-header-icon">👤</div>
                                <h3 className="chat-header-name">
                                    {selectedUserName}
                                </h3>
                            </div>
                        </div>

                        <div className="messages-container">
                            {selectedChat.messages.map((msg, index) => {
                                const isCurrentUser = msg.sender === JSON.parse(atob(token.split('.')[1])).userId;
                                return (
                                    <div
                                        key={index}
                                        className={`message-wrapper ${isCurrentUser ? 'message-right' : 'message-left'}`}
                                    >
                                        <div
                                            className={`message ${isCurrentUser ? 'message-blue' : 'message-gray'}`}
                                        >
                                            <p>{msg.content}</p>
                                            <p className="message-time">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="message-input-area">
                            <div className="message-input-container">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                    className="message-input"
                                    placeholder="Type your message here..."
                                />
                                <button
                                    onClick={sendMessage}
                                    className="send-button"
                                >
                                    ➤
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="no-chat-selected">
                        Select a chat to start messaging
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatApp;