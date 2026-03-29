from pydantic import BaseModel
from typing import List, Optional, Any


class MarkovParams(BaseModel):
    states: List[str]
    transition_matrix: List[List[float]]
    initial_state: List[float]
    steps: int


class StepResult(BaseModel):
    step: int
    title: str
    description: str
    data: Optional[Any] = None


class MarkovResult(BaseModel):
    params: MarkovParams
    stepByStep: List[StepResult]
    finalDistribution: List[float]
    matrixPowers: List[List[List[float]]]
    probabilityEvolution: List[List[float]]
    steadyState: Optional[List[float]]


class MonteCarloResult(BaseModel):
    simulations: int
    frequencies: List[float]
    theoretical: List[float]
    states: List[str]


class SimulationPoint(BaseModel):
    step: int
    distribution: List[float]