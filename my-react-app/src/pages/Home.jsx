import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Send, Trash2, MoreVertical, X, Image as ImageIcon } from 'lucide-react';

export default function Feed() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({ content: '', images: [] });
  const [selectedImages, setSelectedImages] = useState([]);
  const fileInputRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL;

  // Load user
  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (!userData.id) {
      window.location.href = '/login';
      return;
    }
    setUser(userData);
  }, []);

  // Fetch posts
  const fetchPosts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/posts?userId=${user.id}`);
      const data = await response.json();
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  // Create post
  const handleCreatePost = async () => {
    if (!newPost.content.trim()) {
      alert('Vui lòng nhập nội dung bài viết');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          content: newPost.content,
          images: selectedImages.map(img => ({ url: img })),
          privacy: 'public'
        })
      });

      const data = await response.json();
      if (data.success) {
        setPosts([data.post, ...posts]);
        setNewPost({ content: '', images: [] });
        setSelectedImages([]);
        setShowCreatePost(false);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Có lỗi xảy ra khi đăng bài');
    }
  };

  // Like post
  const handleLike = async (postId) => {
    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      const data = await response.json();
      if (data.success) {
        setPosts(posts.map(post => 
          post._id === postId 
            ? { ...post, likeCount: data.likeCount, isLiked: data.isLiked }
            : post
        ));
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  // Delete post
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài viết này?')) return;

    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      const data = await response.json();
      if (data.success) {
        setPosts(posts.filter(post => post._id !== postId));
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedImages.length > 5) {
      alert('Chỉ được tải tối đa 5 ảnh');
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImages(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove image
  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100 pt-16">
      <div className="max-w-2xl mx-auto p-4">
        {/* Create Post Card */}
        <div className="bg-white rounded-2xl shadow-md p-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold">
              {user.name?.[0]}
            </div>
            <button
              onClick={() => setShowCreatePost(true)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 rounded-full px-4 py-2 text-left text-gray-600"
            >
              {user.name} ơi, bạn đang nghĩ gì?
            </button>
          </div>
        </div>

        {/* Create Post Modal */}
        {showCreatePost && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Tạo bài viết</h3>
                <button onClick={() => setShowCreatePost(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold">
                  {user.name?.[0]}
                </div>
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-xs text-gray-500">Công khai</p>
                </div>
              </div>

              <textarea
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                placeholder={`${user.name} ơi, bạn đang nghĩ gì?`}
                className="w-full p-3 border-0 focus:outline-none resize-none"
                rows="4"
                autoFocus
              />

              {/* Image Preview */}
              {selectedImages.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {selectedImages.map((img, index) => (
                    <div key={index} className="relative">
                      <img src={img} alt="" className="w-full h-40 object-cover rounded-lg" />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t pt-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded-lg w-full"
                >
                  <ImageIcon className="w-5 h-5 text-green-500" />
                  <span>Ảnh/Video</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>

              <button
                onClick={handleCreatePost}
                disabled={!newPost.content.trim()}
                className="w-full mt-4 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Đăng
              </button>
            </div>
          </div>
        )}

        {/* Posts Feed */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-8 text-center">
            <p className="text-gray-500 mb-4">Chưa có bài viết nào</p>
            <button
              onClick={() => setShowCreatePost(true)}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            >
              Tạo bài viết đầu tiên
            </button>
          </div>
        ) : (
          posts.map(post => (
            <PostCard
              key={post._id}
              post={post}
              currentUser={user}
              onLike={handleLike}
              onDelete={handleDeletePost}
              formatTime={formatTime}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Post Card Component
function PostCard({ post, currentUser, onLike, onDelete, formatTime }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const isMyPost = post.userId?._id === currentUser.id;

  // Fetch comments
  const fetchComments = async () => {
    try {
      const response = await fetch(`${API_URL}/api/posts/${post._id}/comments`);
      const data = await response.json();
      if (data.success) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  // Post comment
  const handleComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`${API_URL}/api/posts/${post._id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          content: newComment
        })
      });

      const data = await response.json();
      if (data.success) {
        setComments([data.comment, ...comments]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments]);

  return (
    <div className="bg-white rounded-2xl shadow-md mb-6 overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold">
            {post.userId?.name?.[0]}
          </div>
          <div>
            <p className="font-semibold">{post.userId?.name}</p>
            <p className="text-xs text-gray-500">{formatTime(post.createdAt)}</p>
          </div>
        </div>

        {isMyPost && (
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-gray-100 rounded-full">
              <MoreVertical className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-lg py-2 w-40 z-10">
                <button
                  onClick={() => {
                    onDelete(post._id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 text-red-500 flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xóa bài viết</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <div className={`grid ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-1`}>
          {post.images.map((img, index) => (
            <img
              key={index}
              src={img.url}
              alt=""
              className="w-full h-64 object-cover"
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 flex items-center justify-between border-t">
        <div className="flex items-center space-x-1 text-sm text-gray-600">
          <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
          <span>{post.likeCount || 0}</span>
        </div>
        <button
          onClick={() => setShowComments(!showComments)}
          className="text-sm text-gray-600"
        >
          {post.commentCount || 0} bình luận
        </button>
      </div>

      {/* Buttons */}
      <div className="px-4 py-2 border-t flex items-center gap-2">
        <button
          onClick={() => onLike(post._id)}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg hover:bg-gray-100 ${
            post.isLiked ? 'text-red-500' : 'text-gray-600'
          }`}
        >
          <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
          <span className="font-semibold">Thích</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="font-semibold">Bình luận</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t bg-gray-50 p-4">
          {/* Comment Input */}
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
              {currentUser.name?.[0]}
            </div>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleComment()}
              placeholder="Viết bình luận..."
              className="flex-1 bg-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button onClick={handleComment} disabled={!newComment.trim()} className="text-blue-500 disabled:opacity-50">
              <Send className="w-5 h-5" />
            </button>
          </div>

          {/* Comments List */}
          <div className="space-y-3">
            {comments.map(comment => (
              <div key={comment._id} className="flex space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {comment.userId?.name?.[0]}
                </div>
                <div className="flex-1">
                  <div className="bg-white rounded-2xl px-3 py-2">
                    <p className="font-semibold text-sm">{comment.userId?.name}</p>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                  <div className="flex items-center space-x-3 mt-1 px-3 text-xs text-gray-500">
                    <button className="hover:underline">Thích</button>
                    <button className="hover:underline">Trả lời</button>
                    <span>{formatTime(comment.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}