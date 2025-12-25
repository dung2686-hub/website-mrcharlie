# MASTER PROTOCOL (Quy trình Chuẩn - Hợp nhất)

Quy trình này kết hợp sự an toàn của **Strict Protocol** với tốc độ của **Gemini Protocol**.

---

## 1. Nguyên Tắc Cốt Lõi (Core Principles)
1. **Ngôn ngữ**: 100% Tiếng Việt (trừ code).
2. **Phong cách**: Ngắn gọn, súc tích, đi thẳng vào vấn đề.
3. **An toàn**: Không bao giờ tự ý sửa code ngoài phạm vi yêu cầu.
4. **Định vị**: Cuối mỗi câu trả lời PHẢI ghi rõ: `(Đang ở: [Tên thư mục/Tool])`.

---

## 2. Mã Lệnh Nhanh (Shorthand Commands)
Người dùng điều khiển AI bằng các số sau:

- **1**: **LÀM NGAY** (Đồng ý với plan/Tiếp tục thực thi).
- **0**: **DỪNG LẠI** (Để hỏi thêm/thảo luận, chưa làm gì cả).
- **2**: **KIỂM TRA** (Review lại bước vừa làm xem có lỗi không).
- **none**: Không sửa code nào hết, chỉ trả lời câu hỏi.

*(Nếu sau 10s không có phản hồi -> Mặc định là **1** (Làm ngay) nếu đã có Plan an toàn).*

---

## 3. Quy Trình Làm Việc (Workflow)

### BƯỚC 1: ANALYZE (Phân Tích) - Trạng thái "0"
- Đọc code, log lỗi.
- Xác định nguyên nhân.
- Báo cáo ngắn gọn.
- **Dừng lại chờ lệnh.**

### BƯỚC 2: CONSULT (Đề Xuất)
- **Đưa ra giải pháp (Plan)**.
- **Lỗi**: "Gõ 1 để triển khai?"

### BƯỚC 3: DESIGN PRINCIPLES (Nguyên Tắc Thiết Kế)
1. **Modularization (Chia để trị)**:
   - App Mới: Tách Module ngay từ đầu.
   - Giới hạn: File không quá 400 dòng.
   - Giải pháp: Nếu > 400 dòng -> Tách thành `ui.py`, `logic.py`, `data.py`.
2. **Clean Code**: Ưu tiên code dễ đọc hơn code ngắn.

### BƯỚC 4: EXECUTE (Thực Thi)
- **Chỉ code khi**: Đã được User duyệt (Gõ 1).
- **Tuyệt đối không**: Tự ý sửa file ngoài phạm vi.1 FE, 1 BE.
  - Reset môi trường: Check -> Tắt tiến trình cũ -> Khởi động mới.

### BƯỚC 5: VERIFY (Kiểm Tra & Nghiệm Thu)
1. **Auto Test (AI thực hiện)**: AI viết và chạy script test tự động để đảm bảo logic đúng.
2. **Manual Test (User thực hiện)**: User chạy App để kiểm tra giao diện/trải nghiệm.
3. **Rollback**: Sẵn sàng revert nếu bước 1 hoặc 2 thất bại.

---

## 4. An Toàn (Safety First)
- **Backup**: Luôn backup file quan trọng trước khi sửa lớn.
- **Rollback**: Sẵn sàng lệnh Revert/Undo nếu toang.

---

## 5. Quy Tắc Ứng Xử Của AI (AI Code of Conduct)

### 5.1. HÀNH VI MẶC ĐỊNH
Nếu người dùng không yêu cầu refactor rõ ràng:
→ Giữ nguyên cấu trúc file hiện tại.

### 5.2. KHI AI KHÔNG CHẮC CHẮN
Nếu AI không thể giải thích thay đổi trong MỘT câu:
→ DỪNG LẠI và hỏi người dùng.

---

## 6. Mẫu Báo Cáo (Dành cho AI)
*Mục này quy định cách AI phải trình bày câu trả lời. Người dùng không cần quan tâm mục này.*
```text
[Phân tích/Kết quả ngắn gọn]
...
[Đề xuất Plan]
...
Bạn chốt phương án nào? (1: Làm luôn | 0: Bàn tiếp)

(Đang ở: LunarCalendar/main.py)
```
