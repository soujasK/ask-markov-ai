from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models import MarkovParams
from services.solver import solve_markov
from services.simulation import run_monte_carlo, simulation_over_time
from services.parser import parse_question

app = FastAPI(title="Ask Markov AI Backend")

# Allow CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for the deployed frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/parse-markov")
def parse_markov(data: dict):
    question = data.get("question")
    return parse_question(question)


@app.post("/solve-markov")
def solve(params: MarkovParams):
    return solve_markov(params)


@app.post("/run-monte-carlo")
def monte_carlo(data: dict):
    params = MarkovParams(**data["params"])
    simulations = data.get("numSimulations", 10000)
    return run_monte_carlo(params, simulations)


@app.post("/simulation-over-time")
def simulate(data: dict):
    params = MarkovParams(**data["params"])
    steps = data.get("totalSteps", 100)
    return simulation_over_time(params, steps)