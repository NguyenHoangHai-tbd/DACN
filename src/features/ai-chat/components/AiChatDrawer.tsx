import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { aiChatService } from '../services/aiChatService';
import { ChatMessage, Citation } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, X, Send, Bot, User, Link, ThumbsUp, ThumbsDown, Loader2, ArrowRight } from 'lucide-react';
import { useSignalRListener } from '../../../shared/signalr/useSignalRListener';
import { toast } from 'sonner';
import { useRoleStore } from '../../../shared/store/roleStore';

interface AiChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiChatDrawer: React.FC<AiChatDrawerProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [activeConvId, setActiveConvId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentRole = useRoleStore(state => state.currentRole);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen to streaming tokens
  useSignalRListener('chat.tokenStream', (payload: { messageId: string, token: string, isFinished?: boolean, citations?: Citation[], suggestedActions?: string[] }) => {
    setMessages(prev => {
      const msgs = [...prev];
      const targetIdx = msgs.findIndex(m => m.id === payload.messageId);
      if (targetIdx !== -1) {
        msgs[targetIdx] = {
          ...msgs[targetIdx],
          content: msgs[targetIdx].content + payload.token,
          isStreaming: !payload.isFinished,
          citations: payload.citations || msgs[targetIdx].citations,
          suggestedActions: payload.suggestedActions || msgs[targetIdx].suggestedActions
        };
      }
      return msgs;
    });
  });

  const mockStreamingResponse = (messageId: string, question: string) => {
    let mockResponse = "";
    let mockCitations: Citation[] = [];
    let mockActions: string[] = [];

    const lowerQ = question.toLowerCase();

    if (lowerQ.includes('phân quyền') || lowerQ.includes('tài khoản')) {
      mockResponse = "Để phân quyền tài khoản:\n**Bước 1**: Đăng nhập bằng Super Admin.\n**Bước 2**: Vào menu Quản lý tài khoản.\n**Bước 3**: Chọn tài khoản cần chỉnh sửa.\n**Bước 4**: Chọn vai trò mới.\n**Bước 5**: Bấm lưu.\n**Bước 6**: Đăng nhập lại tài khoản đó để kiểm tra giao diện theo quyền mới.";
      mockCitations = [
        { id: 'c1', title: 'Quản lý tài khoản', type: 'member', url: '/admin?tab=users' }
      ];
    } else if (lowerQ.includes('thêm sách')) {
      mockResponse = "Để thêm sách mới:\n**Bước 1**: Vào menu Quản lý sách.\n**Bước 2**: Bấm nút Thêm sách.\n**Bước 3**: Nhập tên sách, tác giả, ISBN và số lượng.\n**Bước 4**: Nếu cần, dùng AI điền thông tin sách.\n**Bước 5**: Bấm Lưu để hoàn tất.";
      mockCitations = [
        { id: 'c2', title: 'Quản lý sách', type: 'inventory', url: '/admin?tab=books' }
      ];
    } else if (lowerQ.includes('mượn sách')) {
      mockResponse = "Để mượn sách:\n**Bước 1**: Vào menu Mượn / Trả sách.\n**Bước 2**: Chọn tab Mượn sách.\n**Bước 3**: Nhập mã độc giả.\n**Bước 4**: Nhập mã sách hoặc ISBN.\n**Bước 5**: Bấm Mượn sách.\n**Bước 6**: Kiểm tra phiếu mượn trong danh sách đang mượn.";
      mockCitations = [
        { id: 'c3', title: 'Mượn / Trả sách', type: 'policy', url: '/admin?tab=circulation' }
      ];
    } else if (lowerQ.includes('trả sách')) {
      mockResponse = "Để trả sách:\n**Bước 1**: Vào menu Mượn / Trả sách.\n**Bước 2**: Chọn tab Trả sách.\n**Bước 3**: Nhập mã phiếu mượn hoặc mã sách.\n**Bước 4**: Bấm Trả sách.\n**Bước 5**: Kiểm tra danh sách phiếu mượn đang hoạt động.";
      mockCitations = [
        { id: 'c4', title: 'Mượn / Trả sách', type: 'policy', url: '/admin?tab=circulation' }
      ];
    } else if (lowerQ.includes('đặt giữ')) {
      mockResponse = "Để đặt giữ sách:\n**Bước 1**: Vào menu Mượn / Trả sách hoặc Đặt giữ của tôi.\n**Bước 2**: Nhập mã độc giả nếu bạn là thủ thư.\n**Bước 3**: Nhập mã sách cần đặt giữ.\n**Bước 4**: Bấm Đặt giữ sách.\n**Bước 5**: Kiểm tra lại danh sách đặt giữ.";
      mockCitations = [
        { id: 'c5', title: 'Đặt giữ', type: 'policy', url: '/admin?tab=circulation' }
      ];
    } else if (lowerQ.includes('tìm kiếm')) {
      mockResponse = "Để tìm kiếm sách:\n**Bước 1**: Vào menu Tìm kiếm sách.\n**Bước 2**: Nhập tên sách, tác giả hoặc ISBN.\n**Bước 3**: Bấm tìm kiếm.\n**Bước 4**: Có thể dùng AI tìm kiếm để tìm theo nhu cầu đọc.";
      mockCitations = [
        { id: 'c6', title: 'Tìm kiếm sách', type: 'inventory', url: '/admin?tab=search' }
      ];
    } else if (lowerQ.includes('báo cáo')) {
      mockResponse = "Để xem báo cáo:\n**Bước 1**: Đăng nhập bằng Admin thư viện.\n**Bước 2**: Vào menu Báo cáo.\n**Bước 3**: Chọn mẫu báo cáo.\n**Bước 4**: Chọn khoảng thời gian.\n**Bước 5**: Bấm chạy báo cáo hoặc xuất file.";
      mockCitations = [
        { id: 'c7', title: 'Báo cáo', type: 'report', url: '/admin?tab=reports' }
      ];
    } else {
      if (currentRole === 'super_admin') {
        mockResponse = "Chào bạn, tôi là trợ lý hướng dẫn sử dụng. Để quản lý tài khoản và phân quyền:\n**Bước 1**: Vào màn hình Admin.\n**Bước 2**: Chọn tab Người dùng hoặc Phân quyền.\n**Bước 3**: Chỉnh sửa thông tin, phân vai trò mới phù hợp và lưu thay đổi.";
        mockCitations = [{ id: 'c1', title: 'Quản lý người dùng', type: 'member', url: '/admin?tab=users' }];
      } else if (currentRole === 'tenant_admin') {
        mockResponse = "Chào bạn, tôi là trợ lý hướng dẫn sử dụng. Để quản trị hệ thống của bạn:\n**Bước 1**: Lựa chọn tính năng phù hợp như Quản lý sách, Độc giả hoặc Báo cáo ở thanh sidebar điều hướng.\n**Bước 2**: Bạn có thể thêm sách, cập nhật thông tin thành viên độc giả hoặc xem thống kê báo cáo hiệu suất hoạt động.";
        mockCitations = [{ id: 'c2', title: 'Bảng quản trị', type: 'policy', url: '/admin' }];
      } else if (currentRole === 'librarian') {
        mockResponse = "Chào bạn, tôi là trợ lý hướng dẫn sử dụng. Để thực hiện tác vụ của thủ thư:\n**Bước 1**: Sử dụng màn hình Mượn/Trả sách để thực hành việc mượn tài liệu, nhận trả hoặc duyệt đặt giữ sách của độc giả.\n**Bước 2**: Bạn cũng có thể tra cứu thông tin sách hoặc thành viên trong mục tương ứng.";
        mockCitations = [{ id: 'c3', title: 'Mượn / Trả', type: 'policy', url: '/admin?tab=circulation' }];
      } else {
        mockResponse = "Chào bạn, tôi là trợ lý hướng dẫn sử dụng. Để tìm kiểm và mượn/đặt sách:\n**Bước 1**: Vào mục Tìm kiếm sách để nhập tên sách cần mượn.\n**Bước 2**: Vào Đặt giữ của tôi để xem lại các sách đã đặt hoặc xem lịch sử sách đang mượn trong hồ sơ cá nhân.";
        mockCitations = [{ id: 'c6', title: 'Tìm kiếm sách', type: 'inventory', url: '/admin?tab=search' }];
      }
    }

    const tokens = mockResponse.split(/(?= )/);
    let currentIdx = 0;

    const interval = setInterval(() => {
      if (currentIdx >= tokens.length) {
        clearInterval(interval);
        window.dispatchEvent(new CustomEvent('signalr:chat.tokenStream', {
          detail: {
            messageId,
            token: '',
            isFinished: true,
            citations: mockCitations,
            suggestedActions: mockActions
          }
        }));
      } else {
        window.dispatchEvent(new CustomEvent('signalr:chat.tokenStream', {
          detail: {
            messageId,
            token: tokens[currentIdx],
            isFinished: false
          }
        }));
        currentIdx++;
      }
    }, 30);
  };

  const sendMutation = useMutation({
    mutationFn: (text: string) => aiChatService.sendMessage(text, activeConvId),
    onSuccess: (data, variables) => {
      setActiveConvId(data.conversationId);
      setMessages(prev => [
        ...prev,
        {
          id: data.messageId,
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
          isStreaming: true
        }
      ]);
      mockStreamingResponse(data.messageId, variables);
    },
    onError: () => {
      toast.error('Không thể phản hồi, vui lòng thử lại.');
    }
  });

  const handleSend = () => {
    if (!inputVal.trim() || sendMutation.isPending) return;
    const text = inputVal;
    setInputVal('');
    setMessages(prev => [
      ...prev,
      { id: `user-${Date.now()}`, role: 'user', content: text, timestamp: new Date().toISOString() }
    ]);
    sendMutation.mutate(text);
  };

  const handleSuggestionClick = (text: string) => {
    setInputVal(text);
  };

  if (!isOpen) return null;

  const getRoleBasedSuggestions = () => {
    if (currentRole === 'super_admin') {
      return [
        "Cách phân quyền tài khoản?",
        "Cách xem danh sách tài khoản?",
        "Cách chuyển giao diện theo từng role?"
      ];
    } else if (currentRole === 'tenant_admin') {
      return [
        "Cách thêm sách mới?",
        "Cách quản lý độc giả?",
        "Cách xem báo cáo thư viện?"
      ];
    } else if (currentRole === 'librarian') {
      return [
        "Cách mượn sách cho độc giả?",
        "Cách trả sách?",
        "Cách đặt giữ sách?"
      ];
    } else {
      return [
        "Cách tìm kiếm sách?",
        "Cách xem sách đang mượn?",
        "Cách đặt giữ sách?"
      ];
    }
  };

  const suggestions = getRoleBasedSuggestions();

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-slate-50 border-l border-slate-200 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-4 shrink-0 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3 text-white">
          <div className="bg-white/10 p-2 rounded-xl">
            <Sparkles size={20} className="text-indigo-300" />
          </div>
          <div>
            <h2 className="font-bold text-sm">Trợ lý hướng dẫn sử dụng</h2>
            <p className="text-xs text-indigo-200">Nhập câu hỏi để được hướng dẫn thao tác từng bước trên hệ thống.</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-300 hover:text-white hover:bg-white/10 rounded-full">
          <X size={20} />
        </Button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
         {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-6">
              <Bot size={48} className="text-indigo-200 mb-4" />
              <h3 className="font-bold text-slate-700 mb-2">Xin chào! Tôi có thể giúp gì cho bạn?</h3>
              <p className="text-sm mb-6">Tôi có thể hướng dẫn bạn thao tác từng bước trên hệ thống quản lý thư viện.</p>
              
              <div className="w-full space-y-2 text-left">
                 <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 ml-1">Gợi ý câu hỏi</p>
                 {suggestions.map((sug, i) => (
                    <button key={i} onClick={() => handleSuggestionClick(sug)} className="w-full block bg-white p-3 rounded-xl border border-slate-200 text-sm hover:border-indigo-300 hover:shadow-sm transition-all text-slate-600 font-medium text-left">
                      "{sug}"
                    </button>
                 ))}
              </div>
            </div>
         ) : (
            messages.map(msg => (
               <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-gradient-to-br from-indigo-600 to-indigo-800 text-white'}`}>
                     {msg.role === 'user' ? <User size={16} /> : <Sparkles size={16} />}
                  </div>
                  <div className={`max-w-[85%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                     <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'}`}>
                        {msg.isStreaming && !msg.content ? (
                           <div className="flex items-center gap-1 opacity-50 py-1">
                              <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"></span>
                              <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                              <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                           </div>
                        ) : (
                           <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
                        )}
                        {msg.isStreaming && msg.content && (
                           <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-indigo-500 animate-pulse"></span>
                        )}
                     </div>

                     {/* Citations */}
                     {msg.citations && msg.citations.length > 0 && !msg.isStreaming && (
                        <div className="space-y-1.5 pt-1">
                           <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Nguồn tham khảo:</div>
                           <div className="flex flex-wrap gap-1.5">
                              {msg.citations.map(cite => {
                                 const friendlyType = 
                                   cite.type === 'inventory' ? 'Kho sách' : 
                                   cite.type === 'member' ? 'Độc giả & Tài khoản' : 
                                   cite.type === 'report' ? 'Báo cáo' : 
                                   cite.type === 'policy' ? 'Chính sách & Quy định' : 
                                   cite.type;
                                 return (
                                    <a key={cite.id} href={cite.url || '#'} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md border border-indigo-100 hover:bg-indigo-100 transition-colors" title={friendlyType}>
                                       <Link size={10} /> {cite.title} <span className="opacity-60 text-[10px] ml-0.5">({friendlyType})</span>
                                    </a>
                                 );
                              })}
                           </div>
                        </div>
                     )}

                     {/* Feedback */}
                     {msg.role === 'assistant' && !msg.isStreaming && (
                        <div className="flex items-center gap-2 pt-1 text-slate-400">
                           <button className="hover:text-indigo-600 transition-colors"><ThumbsUp size={14} /></button>
                           <button className="hover:text-red-500 transition-colors"><ThumbsDown size={14} /></button>
                        </div>
                     )}
                  </div>
               </div>
            ))
         )}
         <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
         <div className="relative">
            <Input 
               value={inputVal}
               onChange={e => setInputVal(e.target.value)}
               onKeyDown={e => {
                  if (e.key === 'Enter') handleSend();
               }}
               placeholder="Hỏi trợ lý AI điều gì đó..."
               className="pr-12 py-6 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-indigo-500 focus-visible:bg-white"
               disabled={sendMutation.isPending}
            />
            <Button 
               size="icon" 
               className="absolute right-1.5 top-1.5 h-9 w-9 bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
               onClick={handleSend}
               disabled={!inputVal.trim() || sendMutation.isPending}
            >
               {sendMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="ml-0.5" />}
            </Button>
         </div>
         <p className="text-[10px] text-center text-slate-400 mt-2">AI có thể trả lời sai. Vui lòng kiểm tra lại thông tin quan trọng.</p>
      </div>
    </div>
  );
};
