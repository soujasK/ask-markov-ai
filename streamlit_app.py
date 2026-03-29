import sys
import os

# Add backend directory to path so we can import its modules seamlessly
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

import streamlit as st
import pandas as pd
import plotly.graph_objects as go

st.set_page_config(page_title="Ask Markov AI", page_icon="🔗", layout="wide")

try:
    from backend.models import MarkovParams
    from backend.services.parser import parse_question
    from backend.services.solver import solve_markov
    from backend.services.simulation import run_monte_carlo, simulation_over_time
except ImportError:
    st.error("Error importing backend modules. Make sure the backend folder is intact.")
    st.stop()

st.title("🔗 Ask Markov AI")
st.markdown("Solve Markov Chains instantly by describing your problem!")

# Sidebar for parsing
st.sidebar.header("Scenario Definition")
question = st.sidebar.text_area(
    "Describe your Markov chain problem:",
    value="The chance of rain tomorrow depends only on today's weather. If it rains today, it will rain tomorrow with probability 0.7. If it does not rain today, it will rain tomorrow with probability 0.4. Calculate the probability that it will rain 4 days from today given that it is raining today.",
    height=200
)

if 'parsed_params' not in st.session_state:
    st.session_state.parsed_params = None

if st.sidebar.button("Analyze Scenario", use_container_width=True):
    with st.spinner("Parsing your question..."):
        try:
            params = parse_question(question)
            st.session_state.parsed_params = params
            st.sidebar.success("Successfully parsed!")
        except Exception as e:
            st.sidebar.error(f"Failed to parse question: {e}")

if st.session_state.parsed_params is not None:
    params: MarkovParams = st.session_state.parsed_params
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.subheader("Transition Matrix")
        df_matrix = pd.DataFrame(params.transition_matrix, columns=params.states, index=params.states)
        st.dataframe(df_matrix, use_container_width=True)
        
    with col2:
        st.subheader("Initial State")
        df_initial = pd.DataFrame([params.initial_state], columns=params.states, index=["Probability"])
        st.dataframe(df_initial, use_container_width=True)
        
    st.markdown("---")
    
    st.subheader("Results")
    tab1, tab2, tab3 = st.tabs(["Step-by-step Solution", "Monte Carlo Simulation", "Evolution Over Time"])
    
    with tab1:
        st.markdown(f"**Calculating {params.steps} steps into the future**")
        result = solve_markov(params)
        df_final = pd.DataFrame([result.finalDistribution], columns=params.states, index=["Final Probabilities"])
        st.table(df_final.style.format("{:.4f}"))
        
        with st.expander("Show detailed steps"):
            for step in result.stepByStep:
                st.markdown(f"**Step {step.step}: {step.title}**")
                st.write(step.description)
                
    with tab2:
        num_sims = st.slider("Number of Simulations", 1000, 100000, 10000, step=1000)
        if st.button("Run Monte Carlo"):
            with st.spinner("Simulating..."):
                mc_res = run_monte_carlo(params, num_sims)
                
                # Plotly Chart
                fig = go.Figure(data=[
                    go.Bar(name='Simulated (Monte Carlo)', x=mc_res.states, y=mc_res.frequencies, marker_color='#3b82f6'),
                    go.Bar(name='Theoretical (Exact)', x=mc_res.states, y=mc_res.theoretical, marker_color='#10b981')
                ])
                fig.update_layout(barmode='group', title=f"Simulation Output after {num_sims:,} runs")
                st.plotly_chart(fig, use_container_width=True)

    with tab3:
        time_res = simulation_over_time(params, 20)
        st.markdown("**Probability Evolution (Next 20 Steps)**")
        
        # Prepare data for plotting
        chart_data = {state: [] for state in params.states}
        for point in time_res:
            for i, prob in enumerate(point.distribution):
                chart_data[params.states[i]].append(prob)
                
        df_evo = pd.DataFrame(chart_data)
        st.line_chart(df_evo)
else:
    st.info("👈 Enter a problem statement in the sidebar and click 'Analyze Scenario'.")
