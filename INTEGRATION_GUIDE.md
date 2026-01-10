# Backend-Frontend Integration Guide

## Overview
This document explains how the Algorithm Testing App backend and frontend are now connected.

## Architecture

### Backend (C# .NET Core API)
- **API Endpoint**: `http://localhost:5046/api/algorithms`
- **WebSocket Endpoint**: `ws://localhost:5046/ws/algorithm`
- CORS enabled for cross-origin requests from frontend

### Frontend (React/TypeScript)
- Fetches algorithm list and details from REST API
- Sends algorithm execution requests via WebSocket
- Displays parameters and allows user configuration

## Components & Services

### Frontend Services

#### 1. **AlgorithmService.ts** (`src/services/`)
Handles REST API communication:
- `getAlgorithms()` - Fetch list of available algorithms
- `getAlgorithmDetails(algorithmName)` - Fetch algorithm parameters and constraints
- `validateParams()` - Validate user-provided parameter values

**Usage**:
```typescript
const algorithms = await AlgorithmService.getAlgorithms();
const details = await AlgorithmService.getAlgorithmDetails('Genetic');
```

#### 2. **AlgorithmWebSocketService.ts** (`src/services/`)
Handles WebSocket communication for algorithm execution:
- `connect(onMessage)` - Connect to WebSocket server
- `sendAlgorithmRequest(request)` - Send algorithm execution request
- `sendCommand(command)` - Send control commands (START, PAUSE, STOP, RESUME)
- `isConnected()` - Check connection status
- `disconnect()` - Close WebSocket connection

**Usage**:
```typescript
const wsService = new AlgorithmWebSocketService();
await wsService.connect((message) => {
  console.log('Received:', message);
});
wsService.sendAlgorithmRequest({
  algorithmName: 'Genetic',
  paramValues: { populationSize: 50, generations: 100 },
  steps: 100,
  functionName: 'sphere'
});
```

### Frontend Components

#### 1. **AlgorithmSelector** (`src/components/`)
Dropdown to select which algorithm to test
- Props: `algorithms`, `selectedAlgorithm`, `onAlgorithmChange`, `disabled`

#### 2. **ParameterInput** (`src/components/`)
Form for inputting algorithm parameters
- Dynamically displays parameters based on selected algorithm
- Shows min/max bounds for each parameter
- Validates input values
- Props: `params`, `onParamChange`, `disabled`

#### 3. **ControlPanel** (`src/components/`)
Main control interface with Start/Stop buttons and progress display

#### 4. **LogsPanel** (`src/components/`)
Displays execution logs and status messages

### Page: AlgorithmTesting.tsx
Main page that coordinates all components and services:
1. Fetches available algorithms on mount
2. Loads algorithm parameters when algorithm is selected
3. Manages WebSocket connection lifecycle
4. Handles algorithm execution and progress tracking

## Data Flow

### Loading Algorithms
```
User opens app
  ↓
AlgorithmTesting.tsx mounts
  ↓
AlgorithmService.getAlgorithms()
  ↓
REST API: GET /api/algorithms
  ↓
AlgorithmsController returns algorithm list
  ↓
Frontend displays AlgorithmSelector with available algorithms
```

### Selecting and Loading Parameters
```
User selects an algorithm
  ↓
AlgorithmTesting.tsx detects selectedAlgorithm change
  ↓
AlgorithmService.getAlgorithmDetails(algorithmName)
  ↓
REST API: GET /api/algorithms/{algorithmName}
  ↓
AlgorithmsController retrieves algorithm params from ParamsInfo
  ↓
ParameterInput component displays parameter form
```

### Running Algorithm
```
User configures parameters and clicks Start
  ↓
AlgorithmTesting validates parameters
  ↓
Connects to WebSocket (if not connected)
  ↓
wsService.sendAlgorithmRequest()
  ↓
WebSocket message sent to: ws://localhost:5046/ws/algorithm
  ↓
Backend WebSocketController processes request
  ↓
AlgorithmHandler.RunAlgorithmAsync() executes algorithm
  ↓
Backend sends status/progress updates via WebSocket
  ↓
Frontend receives messages and updates UI
```

## Backend Implementation Details

### AlgorithmsController (REST API)
Located: `backend/AlgorithmTester.API/AlgorithmTester.API/Controllers/AlgorithmsController.cs`

**Endpoints**:
```
GET /api/algorithms
  Returns: List of available algorithms

GET /api/algorithms/{algorithmName}
  Returns: Algorithm details including parameters
  Example response:
  {
    "id": "Genetic",
    "name": "Genetic Algorithm",
    "description": "Evolutionary algorithm for optimization",
    "params": [
      {
        "name": "populationSize",
        "description": "Number of individuals in a generation",
        "lowerBoundary": 1,
        "upperBoundary": Infinity
      },
      ...
    ]
  }
```

### Algorithm Parameters (from GeneticAlgorithm.cs)
The backend retrieves parameters from `ParamsInfo` property which includes:
- `populationSize` - Population size for each generation
- `generations` - Number of generations to evolve
- `geneCount` - Number of genes per individual
- `mutationProbability` - Probability of mutation
- `crossoverProbability` - Probability of crossover
- And others defined in the algorithm implementation

### WebSocket Handler
Located: `backend/AlgorithmTester.API/AlgorithmTester.Application/WebSocketHandler.cs`
- Listens for incoming algorithm requests
- Routes to AlgorithmHandler for execution
- Sends back status and progress updates

## Configuration

### Backend Port
Default: `5046`
Change in: `backend/AlgorithmTester.API/AlgorithmTester.API/Properties/launchSettings.json`

### Frontend API URL
Current: `http://localhost:5046/api`
Change in: `frontend/algorithm-testing-app/src/services/AlgorithmService.ts`

### WebSocket URL
Current: `ws://localhost:5046/ws/algorithm`
Change in: `frontend/algorithm-testing-app/src/services/AlgorithmWebSocketService.ts`

## Running the Application

### Backend
```bash
cd backend/AlgorithmTester.API/AlgorithmTester.API
dotnet run
```

### Frontend
```bash
cd frontend/algorithm-testing-app
npm install
npm start
```

The application will be available at `http://localhost:3000` (default React port)

## Message Format

### Algorithm Request (Frontend → Backend)
```json
{
  "algorithmName": "Genetic",
  "paramValues": {
    "populationSize": 50,
    "generations": 100,
    "geneCount": 2,
    "minValue": -5.0,
    "maxValue": 5.0,
    "mutationProbability": 0.01,
    "crossoverProbability": 0.8
  },
  "steps": 100,
  "functionName": "sphere"
}
```

### Status Update (Backend → Frontend)
```json
{
  "messageType": "STATUS",
  "status": "Algorithm running...",
  "progress": 50
}
```

## Adding New Algorithms

To add a new algorithm to the system:

1. **Backend Implementation**:
   - Create algorithm class implementing `IOptimizationAlgorithm`
   - Define `ParamsInfo` with algorithm parameters
   - Update `AlgorithmFactory` to instantiate new algorithm

2. **Backend API Update**:
   - Add case in `AlgorithmsController.GetAlgorithms()` to include new algorithm
   - Add case in `GetAlgorithmDetails()` to handle new algorithm

3. **Frontend** will automatically display:
   - New algorithm in the selector
   - Correct parameters based on backend response

## Troubleshooting

### CORS Errors
- Ensure backend CORS policy allows frontend origin
- Check `Program.cs` in backend for CORS configuration

### WebSocket Connection Fails
- Verify backend is running on correct port (5046)
- Check WebSocket URL in `AlgorithmWebSocketService.ts`
- Ensure backend WebSocket endpoint is properly configured

### Missing Parameters
- Verify algorithm's `ParamsInfo` is properly populated
- Check that `GetAlgorithmDetails()` is returning all parameters

### Parameters Not Validating
- Check parameter bounds in algorithm definition
- Verify validation logic in `AlgorithmService.validateParams()`

## Next Steps

1. **Implement actual algorithm execution**:
   - Complete the `AlgorithmHandler.RunAlgorithmAsync()` method
   - Connect to actual test functions

2. **Add real-time progress updates**:
   - Send progress messages from backend during execution
   - Update frontend UI with live metrics

3. **Add function selection**:
   - Create endpoint to list available test functions
   - Allow users to select which function to test

4. **Add result persistence**:
   - Save algorithm execution results
   - Display historical results

5. **Enhance parameter handling**:
   - Add preset parameter configurations
   - Allow saving/loading parameter sets
