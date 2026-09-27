import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

st.set_page_config(page_title="Event Dashboard — Synthetic Demo", page_icon="📊", layout="wide")

GREEN = "#2f7d5f"
BLUE = "#3b6fd6"
ORANGE = "#e0a944"
RED = "#c86464"
GRAY = "#8a8fa3"

st.title("📊 Event Dashboard")
st.caption("Synthetic demo — all names, events, and figures are fictional.")

# ---------------- Event tracker table ----------------
rows = [
    ["2026-08-01", "Online", "Jordan Reyes", "Research Methods Info Session", "Info Session", "None", 22, "Yes", "Online", "Methods Team", "", "Finished", "Public info session for the Research Intensive cohort."],
    ["2026-08-05", "Kanto", "Alex Kim", "Fellowship Mentor Matching Workshop", "Workshop", "Grant", 15, "Yes", "Programme Office", "Fellowship Team", "", "Finished", "Matches incoming fellows with mentors."],
    ["2026-08-12", "Kansai", "Sam Patel", "Quarterly Partner Review", "Client Meeting", "Fee-for-service", 6, "No", "Regional Office", "—", "¥450,000", "Finished", "Internal only, contract renewal discussion."],
    ["2026-08-20", "Online", "Jordan Reyes", "Research Residency Kickoff", "Residency", "Sponsorship", 30, "Yes", "Online", "Residency Team", "", "Finished", "Public kickoff stream for residency cohort."],
    ["2026-09-02", "Kyushu", "Alex Kim", "Community Research Talk", "Community Event", "Fundraised", 40, "Yes", "Community Hall", "Guest Speaker", "", "Finished", "Well attended, repeat quarterly."],
    ["2026-09-15", "Okinawa", "Jordan Reyes", "Residency Open House", "Residency", "Grant", 25, "Yes", "Regional Office", "Residency Team", "", "Finished", "Public open house."],
    ["2026-10-08", "Kansai", "Jordan Reyes", "Community Fundraising Gala", "Community Event", "Fundraised", 60, "Yes", "Community Hall", "Events Team", "¥1,120,000", "Finished", "Large public fundraiser."],
]
cols = ["Date", "Region", "Contact", "Event Name", "Event Type", "Funding Type", "# Att",
        "Public?", "Location", "Presenter", "Revenue", "Status", "Notes"]
df = pd.DataFrame(rows, columns=cols)

with st.expander("Event Tracker (sample rows)", expanded=True):
    st.dataframe(df, use_container_width=True, hide_index=True)

st.header("Self-Updating Analytics")

years = ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026']
attendees = [640, 1120, 3480, 1860, 1540, 4720, 6980, 6340, 5510, 4880]
events = [42, 68, 88, 58, 71, 112, 128, 119, 101, 96]
regions = ['Kanto', 'Kansai', 'Kyushu', 'Okinawa', 'Online']
region_vals = [38, 26, 11, 7, 18]
months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
monthly = [6, 8, 9, 7, 10, 12, 8, 11, 9, 13, 10, 7]
budget_labels = ['Sponsorships', 'Fundraised', 'Fee-for-service', 'Grants']
budget_vals = [6200000, 5900000, 2730000, 4600000]

col1, col2 = st.columns(2)

with col1:
    st.subheader("Annual Attendee Count")
    fig = go.Figure(go.Bar(x=years, y=attendees, marker_color=GREEN))
    fig.update_layout(margin=dict(l=10, r=10, t=10, b=10), height=280)
    st.plotly_chart(fig, use_container_width=True)

with col2:
    st.subheader("Annual Event Count")
    fig = go.Figure(go.Scatter(x=years, y=events, mode="lines+markers", line=dict(color=BLUE)))
    fig.update_layout(margin=dict(l=10, r=10, t=10, b=10), height=280)
    st.plotly_chart(fig, use_container_width=True)

col3, col4 = st.columns(2)

with col3:
    st.subheader("Events by Region (this year)")
    fig = px.pie(names=regions, values=region_vals,
                 color_discrete_sequence=[GREEN, BLUE, ORANGE, RED, GRAY])
    fig.update_layout(margin=dict(l=10, r=10, t=10, b=10), height=280)
    st.plotly_chart(fig, use_container_width=True)

with col4:
    st.subheader("Monthly Event Trend (this year)")
    fig = go.Figure(go.Scatter(x=months, y=monthly, mode="lines+markers", line=dict(color=GREEN)))
    fig.update_layout(margin=dict(l=10, r=10, t=10, b=10), height=280)
    st.plotly_chart(fig, use_container_width=True)

st.subheader("Total Revenue (excl. donations)")
st.metric(label="", value="¥19,430,000")
fig = go.Figure(go.Bar(
    x=budget_vals, y=budget_labels, orientation="h",
    marker_color=[BLUE, RED, ORANGE, GREEN]
))
fig.update_layout(margin=dict(l=10, r=10, t=10, b=10), height=260)
st.plotly_chart(fig, use_container_width=True)

st.caption("Synthetic reconstruction · Google Sheets + Apps Script (backend logic) rebuilt here as a Streamlit front end for demo purposes.")
