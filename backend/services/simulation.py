import numpy as np
from models import MarkovParams, MonteCarloResult, SimulationPoint
from services.solver import solve_markov


def run_monte_carlo(params: MarkovParams, simulations: int = 10000):

    states = params.states
    T = np.array(params.transition_matrix)
    P0 = params.initial_state
    steps = params.steps

    n = len(states)
    counts = [0] * n

    # mimic frontend behaviour
    start_state = P0.index(max(P0))

    for _ in range(simulations):
        current = start_state
        for _ in range(steps):
            r = np.random.random()
            cum = 0
            for j in range(n):
                cum += T[current][j]
                if r <= cum:
                    current = j
                    break
        counts[current] += 1

    frequencies = [c / simulations for c in counts]

    theoretical = solve_markov(params).finalDistribution

    return MonteCarloResult(
        simulations=simulations,
        frequencies=frequencies,
        theoretical=theoretical,
        states=states,
    )


def simulation_over_time(params: MarkovParams, total_steps: int):

    states = params.states
    T = np.array(params.transition_matrix)
    P0 = params.initial_state
    n = len(states)

    start_state = P0.index(max(P0))

    num_sims = 1000
    sample_interval = max(1, total_steps // 50)

    step_counts = {}

    for s in range(0, total_steps + 1, sample_interval):
        step_counts[s] = [0] * n

    if total_steps not in step_counts:
        step_counts[total_steps] = [0] * n

    for _ in range(num_sims):
        current = start_state
        for step in range(1, total_steps + 1):

            r = np.random.random()
            cum = 0
            for j in range(n):
                cum += T[current][j]
                if r <= cum:
                    current = j
                    break

            if step in step_counts:
                step_counts[step][current] += 1

    results = []
    for step in sorted(step_counts.keys()):
        counts = step_counts[step]
        results.append(
            SimulationPoint(
                step=step,
                distribution=[c / num_sims for c in counts],
            )
        )

    return results