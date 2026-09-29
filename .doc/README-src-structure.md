# LibBot Frontend - Cấu trúc source code

Tài liệu này mô tả mục đích của từng folder và file chính trong dự án frontend LibBot.

---

## 1. Cấu trúc gốc

```txt
FE/
├── .doc/                         # Tài liệu mô tả dự án, kiến trúc và hướng dẫn nội bộ
├── src/                          # Mã nguồn chính của ứng dụng React + TypeScript
├── index.html                    # File HTML gốc render ứng dụng React
├── package.json                  # Cấu hình project, dependencies và scripts
├── tsconfig.json                 # Cấu hình TypeScript
├── vite.config.ts                # Cấu hình Vite dev server và build
└── README.md (nếu có)            # Tài liệu bổ sung cho dự án
```

---

## 2. Thư mục src/

```txt
src/
├── app/                          # Cấu hình ứng dụng, router, provider và store Zustand
├── components/                   # Component dùng chung, layout và map
├── features/                     # Feature-based modules theo nghiệp vụ
├── layouts/                      # Layout theo vai trò người dùng
├── pages/                        # Các page tĩnh theo vai trò
├── services/                     # Service giao tiếp backend, realtime và storage
├── types/                        # Type chung của ứng dụng
├── utils/                        # Hàm helper dùng chung
├── mockData.ts                   # Dữ liệu mock để phát triển UI trước backend
├── App.tsx                       # Root component của ứng dụng
├── main.tsx                      # Entry point React
├── index.css                     # Global CSS, theme và styling hệ thống
└── ...
```

---

## 3. app/

### app/config/
- `env.ts`: chứa biến môi trường như `VITE_API_BASE_URL`, `VITE_SIGNALR_URL`
- `constants.ts`: hằng số chung của app như tên app, ID mặc định, màu sắc

### app/router/
- `AppRouter.tsx`: định nghĩa routes của ứng dụng
- `routes.tsx`: khai báo route objects nếu cần mở rộng cấu hình router
- `routePaths.ts`: tập trung các đường dẫn chính của ứng dụng

### app/providers/
- `QueryProvider.tsx`: khởi tạo React Query
- `SignalRProvider.tsx`: khởi tạo kết nối SignalR và quản lý lifecycle
- `AppProvider.tsx`: gom tất cả provider cần thiết cho app

### app/store/
- `authStore.ts`: state xác thực người dùng
- `robotStore.ts`: state chọn robot hiện tại
- `uiStore.ts`: state UI như sidebar, map đang chọn

---

## 4. components/

### components/common/
- `Button/`: button dùng chung cho app
- `Modal/`: modal layout dùng chung
- `Loading/`: component loading
- `EmptyState/`: trạng thái trống

### components/layout/
- `AppSidebar.tsx`: sidebar điều hướng chính
- `AppHeader.tsx`: header của app
- `PageContainer.tsx`: wrapper cho layout page

### components/map/
Các component vẽ bản đồ 2D robot map bằng SVG:
- `MapCanvas.tsx`: canvas chính của map
- `MapBackground.tsx`: nền lưới/bản đồ
- `MapWalls.tsx`: vẽ tường
- `RobotMarker.tsx`: icon robot
- `ShelfMarker.tsx`: kệ sách
- `WaypointMarker.tsx`: điểm waypoint
- `StartMarker.tsx`: điểm bắt đầu
- `GoalMarker.tsx`: điểm đích
- `PathLine.tsx`: đường đi dự kiến
- `MapControls.tsx`: toolbar map
- `MapLegend.tsx`: legend hiển thị trên map

---

## 5. features/

Mỗi feature được tổ chức theo cấu trúc riêng, phù hợp với architecture theo feature-based.

### features/workflows/
- `api/workflowApi.ts`: gọi API workflow
- `components/`: UI cho workflow list, card, step editor, preview
- `hooks/`: hook xử lý workflow (query data, builder, validation)
- `pages/`: page danh sách workflow, detail, builder
- `types/workflow.types.ts`: định nghĩa type cho workflow
- `utils/workflowValidation.ts`: validate workflow trước khi save/dispatch

Mục tiêu:
- định nghĩa reusable workflow template
- chỉnh sửa/cấu hình workflow
- validate trước khi dispatch

### features/missions/
- `api/missionApi.ts`: gọi API mission
- `components/`: mission list, timeline, status, task list
- `hooks/`: hook query mission và realtime updates
- `pages/`: queue page và detail page
- `types/mission.types.ts`: type mission

Mục tiêu:
- theo dõi mission đang chạy, queued, completed, failed
- hiển thị trạng thái theo thời gian thực

### features/dispatch/
- `api/dispatchApi.ts`: preview và dispatch mission
- `components/`: workflow selector, robot selector, dispatch panel, summary, timeline
- `hooks/`: hook preview, dispatch workflow
- `pages/DispatchPreviewPage.tsx`: page chính để chọn workflow, robot, map và xem animation
- `types/dispatch.types.ts`: type cho dispatch và preview

Mục tiêu:
- tạo mission, preview lộ trình, xem animation robot, confirm dispatch

### features/robots/
Thường dùng cho màn hình quản lý robot, trạng thái robot và telemetry.

### features/maps/
Dùng cho quản lý map và phạm vi bản đồ robot.

### features/books/
Dùng cho quản lý sách, kho sách, tra cứu.

### features/shelves/
Dùng cho sơ đồ kệ sách, vị trí kệ.

### features/inventory/
Dùng cho kiểm kê hàng tồn và định vị sách.

### features/misplaced-books/
Dùng cho phát hiện sách mất vị trí.

### features/patrol/
Dùng cho chế độ patrol và lịch trình tuần tra.

### features/notifications/
Dùng cho thông báo và cảnh báo hệ thống.

### features/reports/
Dùng cho báo cáo và analytics.

### features/maintenance/
Dùng cho bảo trì, cập nhật robot, tình trạng thiết bị.

---

## 6. layouts/
- `ReaderLayout.tsx`: layout dành cho vai trò reader
- `LibrarianLayout.tsx`: layout dành cho librarian
- `AdminLayout.tsx`: layout dành cho admin

---

## 7. pages/
- `reader/`: page dành cho người đọc
- `librarian/`: page dành cho thủ thư
- `admin/`: page dành cho quản trị viên

Các page này thường đóng vai trò “trang theo role” và có thể dùng như điểm vào của từng role.

---

## 8. services/

### services/api/
- `axiosClient.ts`: client Axios dùng chung cho backend
- `apiError.ts`: lớp xử lý lỗi chuẩn hóa khi gọi API

### services/realtime/
- `signalRClient.ts`: wrapper SignalR chuẩn hóa event như:
  - `RobotPositionUpdated`
  - `RobotStatusChanged`
  - `MissionStatusChanged`
  - `MissionStepChanged`
  - `RobotBatteryUpdated`

### services/storage/
- `tokenStorage.ts`: lưu và đọc token auth trong browser

---

## 9. types/
- `api.ts`: định nghĩa response API chung
- `common.ts`: type dùng chung như `MissionStatus`, `MissionPriority`, `Mode`
- `map.ts`: type cho map, pose, path, object trên map

---

## 10. utils/
- `formatDate.ts`: format ngày giờ
- `formatDuration.ts`: format thời lượng
- `mapUtils.ts`: chuyển đổi tọa độ từ world sang screen và ngược lại

---

## 11. mockData.ts
File này chứa dữ liệu giả để:
- phát triển UI trước khi backend sẵn sàng
- test giao diện workflow, dispatch, robot, preview
- phát triển route animation và timeline

---

## 12. App bootstrapping

### App.tsx
- bọc app bằng `AppProvider`
- bọc router bằng `BrowserRouter`
- render toàn bộ router ứng dụng

### main.tsx
- entry point của React
- render `App` vào `#root`

### index.css
- chứa biến theme, layout, button, panel, map styles
- định nghĩa UI tổng thể theo phong cách robotics dashboard

---

## 13. Mối quan hệ giữa các layer

```txt
UI Components
   ↓
Feature Pages
   ↓
Hooks
   ↓
API / Realtime / Store
   ↓
Backend / SignalR / Zustand state
```

Điểm cần lưu ý:
- Không đặt business logic trong JSX
- Không viết workflow orchestration trong ROS2 frontend component
- Logic nghiệp vụ nên đặt trong hook/service
- UI chỉ tập trung vào render + tương tác

---

## 14. Kết luận

Dự án frontend LibBot đang được tổ chức theo hướng:
- Feature-based architecture
- React + TypeScript + Vite
- React Query cho server state
- Zustand cho client state
- SignalR cho realtime updates
- SVG map cho prototype robot map

Cấu trúc này có thể mở rộng để kết nối backend ASP.NET Core và hỗ trợ nâng cấp sang map occupancy grid sau này.
