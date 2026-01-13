# Algorithm-Testing App

A full-stack web application for testing and comparing metaheuristic optimization algorithms on various benchmark functions in real-time.

## Features

- **Algorithm Selection**: Choose from multiple metaheuristic algorithms with customizable parameters
- **Function Testing**: Test algorithms on various benchmark functions to compare performance
- **Real-time Monitoring**: Live visualization of algorithm execution via WebSocket communication
- **Report Generation**: Generate and save reports for algorithm runs to analyze results later
- **Algorithm Control**: Start, pause, and terminate algorithm execution at any time
- **Report Management**: Load previously saved reports to compare historical results

## Tech Stack

- **Frontend**: React with TypeScript
- **Backend**: ASP.NET Core 8 with WebSocket support
- **Communication**: WebSockets for real-time algorithm updates

## Installation & Setup

### Prerequisites

- .NET SDK 8 or higher
- ASP.NET Core Runtime 8 or higher
- Node.js 14+ (for frontend)
- npm or yarn (for frontend package management)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd Algorithm-Testing-App/backend/AlgorithmTester.API
```

2. Restore dependencies:
```bash
dotnet restore
```

3. Build the project:
```bash
dotnet build
```

4. Run the backend server:
```bash
dotnet run
```

The backend API will be available at `https://localhost:5046` by default.

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd Algorithm-Testing-App/frontend/algorithm-testing-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will be available at `http://localhost:3000`.

## Usage

1. Open the frontend application in your browser
2. Select a metaheuristic algorithm from the available options
3. Configure algorithm parameters as needed
4. Choose a benchmark function to test
5. Click "Start" to begin the algorithm execution
6. Monitor real-time progress and results
7. Export the report when finished

