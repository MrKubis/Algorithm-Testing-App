const API_BASE_URL = 'http://localhost:5046/api';

export interface Algorithm {
  id: string;
  name: string;
  description: string;
}

export interface AlgorithmWithParams extends Algorithm {
  params: AlgorithmParam[];
}

export interface AlgorithmParam {
  name: string;
  description: string;
  lowerBoundary: number | null;
  upperBoundary: number | null;
  defaultValue?: number;
}

export interface AlgorithmRequest {
  algorithmName: string;
  paramValues: Record<string, number>;
  steps: number;
  functionName: string;
}

export class AlgorithmService {
  /**
   * Fetch all available algorithms from the backend
   */
  static async getAlgorithms(): Promise<Algorithm[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/algorithms`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching algorithms:', error);
      throw error;
    }
  }

  /**
   * Fetch algorithm details including parameters
   */
  static async getAlgorithmDetails(algorithmName: string): Promise<AlgorithmWithParams> {
    try {
      const response = await fetch(`${API_BASE_URL}/algorithms/${algorithmName}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching algorithm details:', error);
      throw error;
    }
  }

  /**
   * Validate algorithm parameters
   */
  static validateParams(params: Record<string, number>, paramDefs: AlgorithmParam[]): string[] {
    const errors: string[] = [];

    paramDefs.forEach(paramDef => {
      const value = params[paramDef.name];

      if (value === undefined) {
        errors.push(`Missing parameter: ${paramDef.name}`);
        return;
      }

      if (paramDef.lowerBoundary !== null && value < paramDef.lowerBoundary) {
        errors.push(`${paramDef.name} must be at least ${paramDef.lowerBoundary}`);
      }

      if (paramDef.upperBoundary !== null && value > paramDef.upperBoundary) {
        errors.push(`${paramDef.name} must be at most ${paramDef.upperBoundary}`);
      }
    });

    return errors;
  }
}

export default AlgorithmService;
