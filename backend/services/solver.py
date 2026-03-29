import numpy as np
from models import MarkovParams, StepResult, MarkovResult


def matrix_power(matrix, power):
    return np.linalg.matrix_power(matrix, power)


def compute_steady_state(matrix):
    try:
        T100 = np.linalg.matrix_power(matrix, 100)
        steady = T100[0]
        for row in T100:
            if not np.allclose(row, steady, atol=1e-3):
                return None
        return steady.tolist()
    except Exception:
        return None


def solve_markov(params: MarkovParams) -> MarkovResult:

    states = params.states
    T = np.array(params.transition_matrix)
    P0 = np.array(params.initial_state)
    steps = params.steps

    matrix_powers = []
    probability_evolution = [P0.tolist()]

    for n in range(1, steps + 1):
        Tn = matrix_power(T, n)
        matrix_powers.append(Tn.tolist())
        dist = P0 @ Tn
        probability_evolution.append(dist.tolist())

    final_distribution = probability_evolution[-1]

    steady_state = compute_steady_state(T)

    step_by_step = [
        StepResult(
            step=1,
            title="Identify States",
            description=f"Identified {len(states)} states: {', '.join(states)}",
            data=states,
        ),
        StepResult(
            step=2,
            title="Build Transition Matrix",
            description=f"Constructed {len(states)}×{len(states)} transition matrix",
            data=params.transition_matrix,
        ),
        StepResult(
            step=3,
            title=f"Calculate Probabilities for {steps} Steps",
            description="Computed T^n and multiplied by initial vector",
            data=matrix_powers,
        ),
        StepResult(
            step=4,
            title="Final Probability Distribution",
            description="Distribution after final step",
            data=final_distribution,
        ),
    ]

    if steady_state:
        step_by_step.append(
            StepResult(
                step=5,
                title="Steady State Distribution",
                description="Long-run equilibrium distribution",
                data=steady_state,
            )
        )

    return MarkovResult(
        params=params,
        stepByStep=step_by_step,
        finalDistribution=final_distribution,
        matrixPowers=matrix_powers,
        probabilityEvolution=probability_evolution,
        steadyState=steady_state,
    )