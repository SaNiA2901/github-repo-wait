/**
 * Network Training Service
 * Specialized service for neural network training with advanced features
 * Separated from monolithic service for better maintainability and testing
 */

import { SecureRandom } from '@/utils/secureCrypto';
import { logger } from '@/utils/logger';
import { errorHandler, ErrorCategory } from '@/utils/errorHandler';

export interface NetworkWeights {
  input_hidden: number[][];
  hidden_output: number[];
  hidden_bias: number[];
  output_bias: number;
}

export interface TrainingExample {
  features: number[];
  target: number; // 1 for UP, 0 for DOWN
  timestamp: number;
  actualOutcome?: number;
  weight?: number; // For weighted training
}

export interface TrainingConfig {
  learningRate: number;
  momentum: number;
  batchSize: number;
  epochs: number;
  validationSplit: number;
  earlyStoppingPatience: number;
  dropoutRate: number;
  l2Regularization: number;
}

export interface TrainingMetrics {
  accuracy: number;
  loss: number;
  validationAccuracy: number;
  validationLoss: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainTime: number;
  epoch: number;
}

export class NetworkTrainingService {
  private static instance: NetworkTrainingService;
  private previousGradients: any = null;
  private bestWeights: NetworkWeights | null = null;
  private bestValidationLoss = Infinity;
  private patienceCounter = 0;
  private trainingHistory: TrainingMetrics[] = [];

  private constructor() {}

  static getInstance(): NetworkTrainingService {
    if (!NetworkTrainingService.instance) {
      NetworkTrainingService.instance = new NetworkTrainingService();
    }
    return NetworkTrainingService.instance;
  }

  /**
   * Initialize network with secure random weights
   */
  initializeNetwork(inputSize: number, hiddenSize: number): NetworkWeights {
    try {
      // Xavier/Glorot initialization with secure random
      const initWeight = (fanIn: number, fanOut: number) => {
        const limit = Math.sqrt(6 / (fanIn + fanOut));
        return (SecureRandom.random() * 2 - 1) * limit;
      };

      const weights: NetworkWeights = {
        input_hidden: Array(inputSize).fill(0).map(() =>
          Array(hiddenSize).fill(0).map(() => initWeight(inputSize, hiddenSize))
        ),
        hidden_output: Array(hiddenSize).fill(0).map(() => initWeight(hiddenSize, 1)),
        hidden_bias: Array(hiddenSize).fill(0).map(() => initWeight(1, hiddenSize)),
        output_bias: initWeight(1, 1)
      };

      logger.info('Neural network initialized', {
        inputSize,
        hiddenSize,
        totalWeights: this.countWeights(weights)
      });

      return weights;
    } catch (error) {
      logger.error('Network initialization failed', { inputSize, hiddenSize }, error as Error);
      return this.getDefaultWeights(inputSize, hiddenSize);
    }
  }

  /**
   * Train network with advanced features: early stopping, regularization, validation
   */
  async trainNetwork(
    weights: NetworkWeights,
    trainingData: TrainingExample[],
    config: TrainingConfig = this.getDefaultConfig()
  ): Promise<{ weights: NetworkWeights; metrics: TrainingMetrics }> {
    return errorHandler.safeExecute(async () => {
      const startTime = Date.now();
      
      if (trainingData.length < 10) {
        throw new Error('Insufficient training data');
      }

      // Split data into training and validation sets
      const { trainSet, validationSet } = this.splitData(trainingData, config.validationSplit);
      
      let currentWeights = this.deepCopyWeights(weights);
      this.bestWeights = this.deepCopyWeights(weights);
      this.bestValidationLoss = Infinity;
      this.patienceCounter = 0;

      logger.info('Starting neural network training', {
        trainingSize: trainSet.length,
        validationSize: validationSet.length,
        config
      });

      let finalMetrics: TrainingMetrics | null = null;

      for (let epoch = 0; epoch < config.epochs; epoch++) {
        // Training phase
        const trainMetrics = await this.trainEpoch(currentWeights, trainSet, config);
        
        // Validation phase
        const validationMetrics = await this.validateEpoch(currentWeights, validationSet);
        
        const epochMetrics: TrainingMetrics = {
          ...trainMetrics,
          validationAccuracy: validationMetrics.accuracy,
          validationLoss: validationMetrics.loss,
          trainTime: Date.now() - startTime,
          epoch
        };

        this.trainingHistory.push(epochMetrics);
        finalMetrics = epochMetrics;

        // Early stopping check
        if (validationMetrics.loss < this.bestValidationLoss) {
          this.bestValidationLoss = validationMetrics.loss;
          this.bestWeights = this.deepCopyWeights(currentWeights);
          this.patienceCounter = 0;
        } else {
          this.patienceCounter++;
          
          if (this.patienceCounter >= config.earlyStoppingPatience) {
            logger.info('Early stopping triggered', {
              epoch,
              patience: this.patienceCounter,
              bestValidationLoss: this.bestValidationLoss
            });
            break;
          }
        }

        // Log progress every 10 epochs
        if (epoch % 10 === 0 || epoch === config.epochs - 1) {
          logger.info('Training progress', {
            epoch,
            trainLoss: trainMetrics.loss.toFixed(4),
            validationLoss: validationMetrics.loss.toFixed(4),
            accuracy: trainMetrics.accuracy.toFixed(3)
          });
        }
      }

      // Use best weights
      const bestWeights = this.bestWeights || currentWeights;

      const totalTime = Date.now() - startTime;
      logger.mlTraining(
        finalMetrics?.accuracy || 0,
        trainingData.length,
        totalTime
      );

      return {
        weights: bestWeights,
        metrics: finalMetrics || this.getDefaultMetrics()
      };

    }, ErrorCategory.ML_PREDICTION, {
      operation: 'network-training',
      dataSize: trainingData.length,
      config
    }) || { weights, metrics: this.getDefaultMetrics() };
  }

  /**
   * Train single epoch with batch processing
   */
  private async trainEpoch(
    weights: NetworkWeights,
    trainSet: TrainingExample[],
    config: TrainingConfig
  ): Promise<Omit<TrainingMetrics, 'validationAccuracy' | 'validationLoss' | 'trainTime' | 'epoch'>> {
    // Shuffle training data securely
    const shuffled = SecureRandom.shuffle([...trainSet]);
    
    let totalLoss = 0;
    let correctPredictions = 0;
    let truePositives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;

    // Process in batches
    for (let i = 0; i < shuffled.length; i += config.batchSize) {
      const batch = shuffled.slice(i, i + config.batchSize);
      const { loss, correct, tp, fp, fn } = await this.trainBatch(weights, batch, config);
      
      totalLoss += loss;
      correctPredictions += correct;
      truePositives += tp;
      falsePositives += fp;
      falseNegatives += fn;
    }

    const accuracy = correctPredictions / trainSet.length;
    const precision = truePositives + falsePositives > 0 ? truePositives / (truePositives + falsePositives) : 0;
    const recall = truePositives + falseNegatives > 0 ? truePositives / (truePositives + falseNegatives) : 0;
    const f1Score = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;

    return {
      accuracy,
      loss: totalLoss / Math.ceil(shuffled.length / config.batchSize),
      precision,
      recall,
      f1Score
    };
  }

  /**
   * Train single batch with backpropagation and regularization
   */
  private async trainBatch(
    weights: NetworkWeights,
    batch: TrainingExample[],
    config: TrainingConfig
  ): Promise<{ loss: number; correct: number; tp: number; fp: number; fn: number }> {
    const totalGradients = this.initializeGradients(weights);
    let totalLoss = 0;
    let correctPredictions = 0;
    let truePositives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;

    for (const example of batch) {
      // Forward pass
      const { hiddenOutputs, output } = this.feedForward(example.features, weights, config.dropoutRate);
      
      // Calculate loss and accuracy
      const prediction = this.sigmoid(output);
      const target = example.target;
      const loss = this.calculateLoss(prediction, target);
      const predicted = prediction > 0.5 ? 1 : 0;
      
      totalLoss += loss;
      
      if (predicted === target) correctPredictions++;
      if (predicted === 1 && target === 1) truePositives++;
      if (predicted === 1 && target === 0) falsePositives++;
      if (predicted === 0 && target === 1) falseNegatives++;

      // Backward pass
      const error = target - prediction;
      const gradients = this.backpropagate(example.features, hiddenOutputs, output, error, weights);
      
      // Apply example weight if provided
      const weight = example.weight || 1.0;
      this.accumulateGradients(totalGradients, gradients, weight);
    }

    // Apply gradients with momentum and regularization
    this.applyGradients(weights, totalGradients, config, batch.length);

    return {
      loss: totalLoss / batch.length,
      correct: correctPredictions,
      tp: truePositives,
      fp: falsePositives,
      fn: falseNegatives
    };
  }

  /**
   * Forward pass through network with dropout
   */
  private feedForward(
    input: number[], 
    weights: NetworkWeights, 
    dropoutRate: number = 0
  ): { hiddenOutputs: number[]; output: number } {
    // Hidden layer with dropout
    const hiddenOutputs = weights.hidden_bias.map((bias, i) => {
      let sum = bias;
      for (let j = 0; j < input.length; j++) {
        sum += input[j] * weights.input_hidden[j][i];
      }
      let activation = this.relu(sum);
      
      // Apply dropout during training
      if (dropoutRate > 0 && SecureRandom.random() < dropoutRate) {
        activation = 0;
      } else if (dropoutRate > 0) {
        activation /= (1 - dropoutRate); // Scale up remaining neurons
      }
      
      return activation;
    });

    // Output layer
    let output = weights.output_bias;
    for (let i = 0; i < hiddenOutputs.length; i++) {
      output += hiddenOutputs[i] * weights.hidden_output[i];
    }

    return { hiddenOutputs, output };
  }

  /**
   * Backpropagation with L2 regularization
   */
  private backpropagate(
    input: number[],
    hiddenOutputs: number[],
    output: number,
    error: number,
    weights: NetworkWeights
  ): any {
    const sigmoidOutput = this.sigmoid(output);
    const outputGradient = error * sigmoidOutput * (1 - sigmoidOutput);

    // Hidden layer gradients
    const hiddenGradients = weights.hidden_output.map((weight, i) => {
      const hiddenError = outputGradient * weight;
      return hiddenError * this.reluDerivative(hiddenOutputs[i]);
    });

    return {
      input_hidden: input.map(inp => 
        hiddenGradients.map(hiddenGrad => inp * hiddenGrad)
      ),
      hidden_output: hiddenOutputs.map(hidden => hidden * outputGradient),
      hidden_bias: hiddenGradients,
      output_bias: outputGradient
    };
  }

  /**
   * Apply gradients with momentum and L2 regularization
   */
  private applyGradients(
    weights: NetworkWeights,
    gradients: any,
    config: TrainingConfig,
    batchSize: number
  ): void {
    // Initialize momentum if needed
    if (!this.previousGradients) {
      this.previousGradients = this.initializeGradients(weights);
    }

    // Update input-hidden weights
    for (let i = 0; i < weights.input_hidden.length; i++) {
      for (let j = 0; j < weights.input_hidden[i].length; j++) {
        const gradient = gradients.input_hidden[i][j] / batchSize;
        const l2Penalty = config.l2Regularization * weights.input_hidden[i][j];
        
        this.previousGradients.input_hidden[i][j] = 
          config.momentum * this.previousGradients.input_hidden[i][j] +
          config.learningRate * (gradient - l2Penalty);
        
        weights.input_hidden[i][j] += this.previousGradients.input_hidden[i][j];
      }
    }

    // Update hidden-output weights
    for (let i = 0; i < weights.hidden_output.length; i++) {
      const gradient = gradients.hidden_output[i] / batchSize;
      const l2Penalty = config.l2Regularization * weights.hidden_output[i];
      
      this.previousGradients.hidden_output[i] = 
        config.momentum * this.previousGradients.hidden_output[i] +
        config.learningRate * (gradient - l2Penalty);
      
      weights.hidden_output[i] += this.previousGradients.hidden_output[i];
    }

    // Update biases
    for (let i = 0; i < weights.hidden_bias.length; i++) {
      const gradient = gradients.hidden_bias[i] / batchSize;
      
      this.previousGradients.hidden_bias[i] = 
        config.momentum * this.previousGradients.hidden_bias[i] +
        config.learningRate * gradient;
      
      weights.hidden_bias[i] += this.previousGradients.hidden_bias[i];
    }

    const outputGradient = gradients.output_bias / batchSize;
    this.previousGradients.output_bias = 
      config.momentum * this.previousGradients.output_bias +
      config.learningRate * outputGradient;
    
    weights.output_bias += this.previousGradients.output_bias;
  }

  /**
   * Validate network performance on validation set
   */
  private async validateEpoch(
    weights: NetworkWeights,
    validationSet: TrainingExample[]
  ): Promise<{ accuracy: number; loss: number }> {
    let totalLoss = 0;
    let correctPredictions = 0;

    for (const example of validationSet) {
      const { output } = this.feedForward(example.features, weights, 0); // No dropout during validation
      const prediction = this.sigmoid(output);
      const loss = this.calculateLoss(prediction, example.target);
      
      totalLoss += loss;
      if ((prediction > 0.5 ? 1 : 0) === example.target) {
        correctPredictions++;
      }
    }

    return {
      accuracy: correctPredictions / validationSet.length,
      loss: totalLoss / validationSet.length
    };
  }

  // Activation functions
  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
  }

  private relu(x: number): number {
    return Math.max(0, x);
  }

  private reluDerivative(x: number): number {
    return x > 0 ? 1 : 0;
  }

  // Loss function
  private calculateLoss(prediction: number, target: number): number {
    // Binary cross-entropy loss
    const epsilon = 1e-15; // Prevent log(0)
    const clipped = Math.max(epsilon, Math.min(1 - epsilon, prediction));
    return -(target * Math.log(clipped) + (1 - target) * Math.log(1 - clipped));
  }

  // Utility methods
  private splitData(data: TrainingExample[], validationSplit: number): {
    trainSet: TrainingExample[];
    validationSet: TrainingExample[];
  } {
    const shuffled = SecureRandom.shuffle([...data]);
    const splitIndex = Math.floor(shuffled.length * (1 - validationSplit));
    
    return {
      trainSet: shuffled.slice(0, splitIndex),
      validationSet: shuffled.slice(splitIndex)
    };
  }

  private initializeGradients(weights: NetworkWeights): any {
    return {
      input_hidden: weights.input_hidden.map(row => row.map(() => 0)),
      hidden_output: weights.hidden_output.map(() => 0),
      hidden_bias: weights.hidden_bias.map(() => 0),
      output_bias: 0
    };
  }

  private accumulateGradients(total: any, batch: any, weight: number = 1): void {
    // Accumulate input-hidden gradients
    for (let i = 0; i < total.input_hidden.length; i++) {
      for (let j = 0; j < total.input_hidden[i].length; j++) {
        total.input_hidden[i][j] += batch.input_hidden[i][j] * weight;
      }
    }

    // Accumulate other gradients
    for (let i = 0; i < total.hidden_output.length; i++) {
      total.hidden_output[i] += batch.hidden_output[i] * weight;
    }

    for (let i = 0; i < total.hidden_bias.length; i++) {
      total.hidden_bias[i] += batch.hidden_bias[i] * weight;
    }

    total.output_bias += batch.output_bias * weight;
  }

  private deepCopyWeights(weights: NetworkWeights): NetworkWeights {
    return {
      input_hidden: weights.input_hidden.map(row => [...row]),
      hidden_output: [...weights.hidden_output],
      hidden_bias: [...weights.hidden_bias],
      output_bias: weights.output_bias
    };
  }

  private countWeights(weights: NetworkWeights): number {
    let count = 0;
    count += weights.input_hidden.flat().length;
    count += weights.hidden_output.length;
    count += weights.hidden_bias.length;
    count += 1; // output_bias
    return count;
  }

  private getDefaultConfig(): TrainingConfig {
    return {
      learningRate: 0.001,
      momentum: 0.9,
      batchSize: 32,
      epochs: 100,
      validationSplit: 0.2,
      earlyStoppingPatience: 10,
      dropoutRate: 0.1,
      l2Regularization: 0.001
    };
  }

  private getDefaultWeights(inputSize: number, hiddenSize: number): NetworkWeights {
    return {
      input_hidden: Array(inputSize).fill(0).map(() => Array(hiddenSize).fill(0)),
      hidden_output: Array(hiddenSize).fill(0),
      hidden_bias: Array(hiddenSize).fill(0),
      output_bias: 0
    };
  }

  private getDefaultMetrics(): TrainingMetrics {
    return {
      accuracy: 0.5,
      loss: 1.0,
      validationAccuracy: 0.5,
      validationLoss: 1.0,
      precision: 0.5,
      recall: 0.5,
      f1Score: 0.5,
      trainTime: 0,
      epoch: 0
    };
  }

  // Public getters
  getTrainingHistory(): TrainingMetrics[] {
    return [...this.trainingHistory];
  }

  getBestValidationLoss(): number {
    return this.bestValidationLoss;
  }

  clearHistory(): void {
    this.trainingHistory = [];
    this.previousGradients = null;
    this.bestWeights = null;
    this.bestValidationLoss = Infinity;
    this.patienceCounter = 0;
  }
}

export const networkTrainingService = NetworkTrainingService.getInstance();