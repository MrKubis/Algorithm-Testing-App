export interface ParamInfo {
  Name: string;
  Description: string;
  UpperBoundary: number;
  LowerBoundary: number;
}

export interface AlgorithmMetadata {
  ClassName: string;
  DisplayName?: string;
  ParamsInfo: ParamInfo[];
}

export interface AlgorithmRequest {
  AlgorithmName: string;
  Parameters: { [key: string]: number };
  FunctionList: string[];
}

export interface TestResult {
  type: string;
  value: number | string;
}
