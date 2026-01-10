## API structure

There are 2 types of Messages:
- Request - used to send data to test
- Command - used to start/stop running test

## Requests - Test Single Algorithm

To test a single algorithm we pass:
- the name of the algorithm
- its parameters
- number of steps
- list of functions to test it on

The structure of this request (example) :
```
{
  "MessageType":"REQUEST",
  "Request":{
    "Type":"Algorithm",
    "Body":{
      "AlgorithmName": "Genetic",
      "ParamValues": {
          "populationSize" : 500,
          "geneCount" : 5,
          "mutationProbability" : 0.1,
          "crossoverProbability" : 0.8
      },
      "Steps":1000,
      "FunctionList":[
        {
          "FunctionName" : "Rastragin",
          "minValue" : -5.12,
          "maxValue" : 5.12
        }
      ]
    }
  }
}
```
We can also add arguments and step that the algorithm should start from.
## Request - Test Multiple Algorithms
To test a single function we pass:
- the name of the function
- number of steps
- min value
- max value
- The list of algorithms
The structure of this request (example) :
```
{
  "MessageType":"REQUEST",
  "Request":{
    "Type" : "Function",
    "Body" : {
        "FunctionName" : "Rastragin",
        "Steps" : 1000,
        "minValue" : -5.12,
        "maxValue" : 5.12,
        "AlgorithmList" : [
            {
                "AlgorithmName":"Genetic",
                "ParamValues": {
                    "populationSize" : 500,
                    "geneCount" : 5,
                    "minValue" : -5.12,
                    "maxValue" : 5.12,
                    "mutationProbability" : 0.1,
                    "crossoverProbability" : 0.8
                }
            }
        ]
    }
}
}
```

## Command - starting a test
