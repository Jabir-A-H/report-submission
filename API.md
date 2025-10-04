# 📄 API Reference

## Authentication Endpoints

| Method   | Endpoint    | Description         |
| -------- | ----------- | ------------------- |
| GET      | `/`         | Landing page        |
| GET/POST | `/login`    | User authentication |
| POST     | `/logout`   | User logout         |
| GET/POST | `/register` | User registration   |

## Report Management

| Method   | Endpoint                 | Description               |
| -------- | ------------------------ | ------------------------- |
| GET      | `/dashboard`             | User dashboard            |
| GET      | `/report`                | Report summary            |
| GET/POST | `/report/header`         | Report header information |
| GET/POST | `/report/courses`        | Course reports            |
| GET/POST | `/report/organizational` | Organizational reports    |
| GET/POST | `/report/personal`       | Personal reports          |
| GET/POST | `/report/meetings`       | Meeting reports           |
| GET/POST | `/report/extras`         | Extra activities reports  |
| GET/POST | `/report/comments`       | Report comments           |

## Administration

| Method   | Endpoint                | Description           |
| -------- | ----------------------- | --------------------- |
| GET/POST | `/users`                | User management       |
| GET/POST | `/zones`                | Zone management       |
| POST     | `/delete_zone/<id>`     | Delete zone           |
| GET/POST | `/city_report`          | City-level reports    |
| GET/POST | `/city_report/override` | City report overrides |

## Download/Export Endpoints

| Method | Endpoint                    | Description                 |
| ------ | --------------------------- | --------------------------- |
| GET    | `/download/excel`           | Download reports as Excel   |
| GET    | `/download/pdf`             | Download reports as PDF     |
| GET    | `/download/city_report_pdf` | Download city report as PDF |

## Utility Endpoints

| Method | Endpoint        | Description           |
| ------ | --------------- | --------------------- |
| GET    | `/help`         | Help page             |
| POST   | `/fix-sequence` | Fix database sequence |

---

*For detailed endpoint documentation and request/response examples, see the main application code in `app.py`.*