import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Avatar,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Badge,
  InputAdornment,
  Menu,
  MenuItem,
  Chip,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  Description as DocumentIcon,
  Check,
  DoneAll,
  Close as CloseIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import './WhatsAppChat.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const WhatsAppChat = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.conversation_id);
      const interval = setInterval(() => {
        loadMessages(selectedConversation.conversation_id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/whatsapp/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(response.data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/whatsapp/conversation/${conversationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const uploadResponse = await axios.post(
          `${API_URL}/api/upload-temp`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        await axios.post(
          `${API_URL}/api/whatsapp/send-media`,
          {
            to_phone: selectedConversation.other_party,
            media_url: uploadResponse.data.url,
            media_type: getMediaType(selectedFile.type),
            caption: newMessage || null
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setSelectedFile(null);
        setFilePreview(null);
      } else {
        await axios.post(
          `${API_URL}/api/whatsapp/send-message`,
          {
            to_phone: selectedConversation.other_party,
            message: newMessage
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setNewMessage('');
      loadMessages(selectedConversation.conversation_id);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
    setLoading(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const getMediaType = (mimeType) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'document';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    if (status === 'sent') return <Check sx={{ fontSize: 16 }} />;
    if (status === 'delivered') return <DoneAll sx={{ fontSize: 16 }} />;
    if (status === 'read') return <DoneAll sx={{ fontSize: 16, color: '#34B7F1' }} />;
    return null;
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.other_party.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box className="whatsapp-container" sx={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar - Conversations List */}
      <Paper
        elevation={3}
        sx={{
          width: 400,
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#f0f2f5'
        }}
      >
        {/* Header */}
        <Box
          sx={{
            bgcolor: '#00A884',
            color: 'white',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Chats
          </Typography>
          <IconButton onClick={handleMenuOpen} sx={{ color: 'white' }}>
            <MoreVertIcon />
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={handleMenuClose}>New Chat</MenuItem>
            <MenuItem onClick={handleMenuClose}>Settings</MenuItem>
            <MenuItem onClick={handleMenuClose}>Logout</MenuItem>
          </Menu>
        </Box>

        {/* Search */}
        <Box sx={{ p: 1, bgcolor: 'white' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
        </Box>

        {/* Conversations List */}
        <List sx={{ overflow: 'auto', flexGrow: 1, p: 0 }}>
          {filteredConversations.map((conv) => (
            <React.Fragment key={conv.conversation_id}>
              <ListItem
                button
                selected={selectedConversation?.conversation_id === conv.conversation_id}
                onClick={() => setSelectedConversation(conv)}
                sx={{
                  bgcolor:
                    selectedConversation?.conversation_id === conv.conversation_id
                      ? '#f0f2f5'
                      : 'white',
                  '&:hover': { bgcolor: '#f5f6f6' },
                  py: 1.5
                }}
              >
                <ListItemAvatar>
                  <Badge badgeContent={conv.unread_count} color="success">
                    <Avatar sx={{ bgcolor: '#00A884' }}>
                      {conv.other_party.slice(-2)}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {conv.other_party}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(new Date(conv.last_message.timestamp), {
                          addSuffix: false
                        })}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      noWrap
                      sx={{ mt: 0.5 }}
                    >
                      {conv.last_message.type === 'text'
                        ? conv.last_message.text
                        : `📎 ${conv.last_message.type}`}
                    </Typography>
                  }
                />
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </Paper>

      {/* Chat Area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', bgcolor: '#efeae2' }}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <Paper
              elevation={2}
              sx={{
                p: 2,
                bgcolor: '#f0f2f5',
                borderRadius: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#00A884' }}>
                  {selectedConversation.other_party.slice(-2)}
                </Avatar>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedConversation.other_party}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Online
                  </Typography>
                </Box>
              </Box>
              <IconButton>
                <MoreVertIcon />
              </IconButton>
            </Paper>

            {/* Messages Area */}
            <Box
              sx={{
                flexGrow: 1,
                overflow: 'auto',
                p: 2,
                backgroundImage: 'url(/whatsapp-bg.png)',
                backgroundSize: 'cover'
              }}
            >
              {messages.map((msg, index) => (
                <Box
                  key={msg.id}
                  sx={{
                    display: 'flex',
                    justifyContent: msg.direction === 'outbound' ? 'flex-end' : 'flex-start',
                    mb: 1
                  }}
                >
                  <Paper
                    elevation={1}
                    sx={{
                      maxWidth: '65%',
                      p: 1.5,
                      bgcolor: msg.direction === 'outbound' ? '#d9fdd3' : 'white',
                      borderRadius: '8px',
                      position: 'relative'
                    }}
                  >
                    {/* Image Message */}
                    {msg.type === 'image' && msg.media_url && (
                      <Box sx={{ mb: msg.body ? 1 : 0 }}>
                        <img
                          src={msg.media_url}
                          alt="Shared"
                          style={{
                            maxWidth: '100%',
                            borderRadius: '8px',
                            display: 'block'
                          }}
                        />
                      </Box>
                    )}

                    {/* Video Message */}
                    {msg.type === 'video' && msg.media_url && (
                      <Box sx={{ mb: msg.body ? 1 : 0 }}>
                        <video
                          controls
                          style={{ maxWidth: '100%', borderRadius: '8px' }}
                        >
                          <source src={msg.media_url} />
                        </video>
                      </Box>
                    )}

                    {/* Document Message */}
                    {msg.type === 'document' && msg.media_url && (
                      <Chip
                        icon={<DocumentIcon />}
                        label="View Document"
                        component="a"
                        href={msg.media_url}
                        target="_blank"
                        clickable
                        sx={{ mb: msg.body ? 1 : 0 }}
                      />
                    )}

                    {/* Text Content */}
                    {msg.body && (
                      <Typography
                        variant="body2"
                        sx={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}
                      >
                        {msg.body}
                      </Typography>
                    )}

                    {/* Timestamp & Status */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        justifyContent: 'flex-end',
                        mt: 0.5
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {formatTime(msg.timestamp)}
                      </Typography>
                      {msg.direction === 'outbound' && getStatusIcon(msg.status)}
                    </Box>
                  </Paper>
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </Box>

            {/* File Preview */}
            {filePreview && (
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'white',
                  borderTop: '1px solid #ddd',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                <img
                  src={filePreview}
                  alt="Preview"
                  style={{ maxHeight: '100px', borderRadius: '8px' }}
                />
                <Typography variant="body2">{selectedFile?.name}</Typography>
                <IconButton onClick={() => { setSelectedFile(null); setFilePreview(null); }}>
                  <CloseIcon />
                </IconButton>
              </Box>
            )}

            {/* Message Input */}
            <Paper
              component="form"
              onSubmit={handleSendMessage}
              sx={{
                p: 1.5,
                display: 'flex',
                alignItems: 'flex-end',
                gap: 1,
                borderRadius: 0
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
              />
              
              <Tooltip title="Attach file">
                <IconButton onClick={() => fileInputRef.current?.click()} color="primary">
                  <AttachFileIcon />
                </IconButton>
              </Tooltip>

              <TextField
                fullWidth
                multiline
                maxRows={4}
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                variant="outlined"
                size="small"
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '20px'
                  }
                }}
              />

              <Tooltip title="Send">
                <span>
                  <IconButton
                    type="submit"
                    disabled={loading || (!newMessage.trim() && !selectedFile)}
                    sx={{
                      bgcolor: '#00A884',
                      color: 'white',
                      '&:hover': { bgcolor: '#008f6f' },
                      '&:disabled': { bgcolor: '#e0e0e0' }
                    }}
                  >
                    {loading ? <CircularProgress size={24} /> : <SendIcon />}
                  </IconButton>
                </span>
              </Tooltip>
            </Paper>
          </>
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              flexDirection: 'column',
              gap: 2
            }}
          >
            <Avatar sx={{ width: 120, height: 120, bgcolor: '#00A884' }}>
              <Typography variant="h3">💬</Typography>
            </Avatar>
            <Typography variant="h5" color="text.secondary">
              Select a conversation to start chatting
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default WhatsAppChat;
