# Sử Việt Ký

Ứng dụng tra cứu và lưu trữ tri thức lịch sử Việt Nam.

## Tra cứu sự kiện theo năm bằng AI

Trang `search.html?year=1945` gọi Supabase Edge Function để Gemini tra cứu web bằng Google Search grounding, tổng hợp sự kiện có nguồn tham khảo và tìm ảnh minh họa trên Wikimedia Commons. Khóa Gemini chỉ lưu ở máy chủ, không đưa vào mã chạy trên trình duyệt.

### Cấu hình triển khai

1. Tạo API key trong Google AI Studio.
2. Cài Supabase CLI và đăng nhập vào tài khoản quản lý dự án.
3. Trong Supabase Dashboard, mở **Edge Functions → Secrets**, thêm secret tên `GEMINI_API_KEY` và nhập API key vừa tạo. Không đặt key trong mã nguồn hoặc lệnh gửi lên trình duyệt.
4. Triển khai Edge Function từ thư mục gốc dự án:

   ```powershell
   npx supabase functions deploy historical-year-search --project-ref ifxtcfnfjiltdxsfxjjr
   ```

Function cho phép khách chưa đăng nhập tra cứu công khai. Giới hạn 12 lượt gọi mỗi IP trong 10 phút được áp dụng trên mỗi instance; nên cấu hình hạn mức chi tiêu/API quota trong Google Cloud hoặc Google AI Studio để bảo vệ dịch vụ.

Nếu AI chưa khả dụng, các năm có dữ liệu biên soạn sẵn vẫn hiển thị kèm thông báo; những năm chưa có dữ liệu sẽ báo lỗi và cho phép thử lại.
