# Bus Station Ticket Application

A comprehensive bus station management system built with Node.js and TypeScript, providing functionality for managing bus trips, ticket bookings, and user management.

## Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (with Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens)
- **API Security**:
  - Helmet for security headers
  - CORS enabled
  - Rate limiting
  - Express validator for input validation
- **Logging & Debugging**:
  - Winston for logging
  - Debug for development logging
- **Task Scheduling**: Agenda.js
- **Other Tools**:
  - dotenv for environment configuration
  - shortid for ID generation

### Features & Architecture

#### Core Architecture
- **RESTful API Design**
- **MVC Architecture**:
  - Controllers
  - Services
  - DAOs (Data Access Objects)

#### Core Modules
1. **User Management**
   - User registration and authentication
   - Role-based access control (Admin, Trip Guide, User)

2. **Authentication & Authorization**
   - JWT-based authentication
   - Permission-based access control
   - Secure route protection

3. **Trip Management**
   - Create, read, update, and delete trips
   - Schedule management
   - Automated status updates
   - Trip search functionality

4. **Ticket Booking**
   - Ticket creation and management
   - Automated ticket status updates
   - Booking validation

5. **Bus Management**
   - Bus registration and tracking
   - Seat management
   - Bus type categorization

6. **Reviews & Ratings**
   - Trip review system
   - Rating management

7. **Cities Management**
   - City registration
   - Route management

### API Security Features
- Request rate limiting
- Input validation and sanitization
- Security headers with Helmet
- CORS protection
- Error handling middleware

### Task Automation
- Automated trip status updates
- Scheduled ticket status management
- Background job processing with Agenda.js

## Getting Started

### Prerequisites
- Node.js
- MongoDB
- npm or yarn

### Installation
1. Clone the repository
```bash
git clone https://github.com/M00rish/TicketApp.git