# KIẾN TRÚC & HƯỚNG DẪN PHÁT TRIỂN

## 1. Mô Hình Kiến Trúc: "PyQt Modular Manager Pattern"
Dự án này tuân thủ kiến trúc **Modular Manager** nghiêm ngặt, được thiết kế để mở rộng, bảo trì và nhân bản.
Nó tách biệt các mối quan tâm thành ba lớp riêng biệt: **Khởi động (Bootstrap)**, **Điều phối (Orchestration)**, và **Logic/Giao diện (Logic/View)**.

---

## 2. Cấu Trúc Thành Phần Cốt Lõi

### 🟢 Lớp 1: Khởi động (Bootstrap - Người chạy)
- **File**: `run.py`
- **Trách nhiệm**: 
    - Quản lý Khởi động & Vòng đời ứng dụng.
    - Thiết lập môi trường (Đường dẫn, Logging).
    - Màn hình chờ & Kiểm tra bản quyền.
    - Khóa đơn thể (Single Instance).
- **Quy tắc**: KHÔNG BAO GIỜ chứa logic nghiệp vụ hoặc định nghĩa giao diện.

### 🟡 Lớp 2: Điều phối (Orchestration - Trung tâm)
- **File**: `main.py` (Lớp `MainWindow`)
- **Trách nhiệm**: 
    - Khởi tạo container Cửa sổ chính.
    - **Dependency Injection**: Khởi tạo Managers và tiêm các phụ thuộc (Database, API).
    - Kết nối Signals/Slots giữa UI và Managers.
- **Quy tắc**: Giữ file này "Mỏng". Nó giao việc, không làm việc. Mục tiêu < 400 dòng.

### 🔵 Lớp 3: Managers (Bộ não - Logic nghiệp vụ)
- **Tên**: `*_manager.py` (vd: `spotlight_manager.py`, `data_manager.py`)
- **Trách nhiệm**: 
    - Xử lý logic tính năng cụ thể (vd: Tìm kiếm, Thao tác DB, Thông báo).
    - Quản lý trạng thái riêng.
    - Tương tác với Database.
- **Quy tắc**: Độ kết dính cao (High Cohesion). Một manager xử lý MỘT nghiệp vụ.

### 🟣 Lớp 4: Thành phần UI (Gương mặt - View)
- **Tên**: `ui_*.py` (vd: `ui_info_tab.py`, `ui_dialogs.py`)
- **Trách nhiệm**: 
    - Định nghĩa Widgets, Layouts, và Styles.
    - Hiển thị dữ liệu được gửi từ Managers.
- **Quy tắc**: View thụ động (Passive View). UI không được thực hiện logic phức tạp hoặc truy vấn database trực tiếp.

---

## 3. Tiêu Chí Refactoring (4 Quy Tắc Vàng)
**CHỈ** tách file hoặc tạo module mới nếu vi phạm một trong các quy tắc sau:

1.  **Nguyên Tắc Đơn Nhiệm (SRP)**:
    - *Vi phạm*: Một file xử lý > 1 nghiệp vụ khác biệt (vd: `main.py` xử lý cả *Quản lý cửa sổ* và *Xuất dữ liệu*).
    - *Hành động*: Tách thành `window_manager.py` và `data_manager.py`.

2.  **Khả Năng Khám Phá (Khó tìm)**:
    - *Vi phạm*: Logic quan trọng bị vùi trong một file 1000 dòng.
    - *Hành động*: Tách thành component có tên rõ ràng để developer biết tìm ở đâu.

3.  **Độ Kết Dính Cao (Nhóm thứ liên quan)**:
    - *Vi phạm*: Các hàm liên quan (vd: `show`, `hide`, `minimize`) nằm rải rác.
    - *Hành động*: Gom chúng vào một Class/Manager duy nhất.

4.  **Sự Phụ Thuộc Thấp (Tái sử dụng)**:
    - *Vi phạm*: Code A phụ thuộc Code B không cần thiết, làm khó test/tái sử dụng A.
    - *Hành động*: Tách biệt thông qua Dependency Injection (truyền object vào `__init__` thay vì import toàn cục).

---

## 4. Quy Trình Phát Triển (Cách mở rộng)
Để thêm tính năng mới (vd: "Module Bán Hàng"):

1.  **Tạo UI**: `ui_sales.py` (Định nghĩa giao diện).
2.  **Tạo Logic**: `sales_manager.py` (Định nghĩa hành vi).
3.  **Đăng ký**: Trong `main.py`:
    ```python
    self.sales_manager = SalesManager(self.database)
    self.ui_sales = UISales()
    self.ui_sales.submit_btn.clicked.connect(self.sales_manager.process_sale)
    ```

---

## 5. Quy Ước Đặt Tên
- **Files**: `lower_case_with_underscores.py`
- **Classes**: `PascalCase`
- **Variables/Functions**: `snake_case`
- **Constants**: `UPPER_CASE`
- **Private Members**: `_prefix`

---

## 6. Quy Tắc Tối Thượng Cho AI (AI Auto-Split Rule)

AI CHỈ ĐƯỢC PHÉP tách file nếu file đó vi phạm rõ ràng MỘT quy tắc.
Nếu không chắc chắn → KHÔNG TÁCH.

---

*Tài liệu này đóng vai trò là nguồn chân lý duy nhất cho các quyết định kiến trúc trong dự án này.*
