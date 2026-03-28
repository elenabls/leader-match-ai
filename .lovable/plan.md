

# LeaderMatch AI - Implementation Plan

## Single-Page App with Leader Compatibility Evaluation

### Layout
- Clean, minimal design with a centered card-based layout
- App title "LeaderMatch AI" with a brief tagline
- Four sections stacked vertically, followed by results

### Section 1-3: Input Controls
- Three styled dropdowns for Leader A (Production Head), Leader B (Quality Head), and Scenario
- Each option shows the leader name + brief trait description

### Section 4: Evaluate Button
- Prominent "Evaluate Team" button

### Internal Leader Data
- **Alex**: speed 9, strictness 3, risk 8
- **Sarah**: speed 6, strictness 5, risk 5
- **John**: speed 3, strictness 9, risk 2
- **Emma**: speed 4, strictness 9, risk 3
- **Mike**: speed 8, strictness 3, risk 7
- **Lisa**: speed 5, strictness 6, risk 5

### Evaluation Engine
- Start at 100, apply conflict/compatibility rules as specified
- Scenario adjustments weight relevant traits
- Generate strengths, risks, and recommendation text with reasoning

### Results Display
- Compatibility score as a large percentage with color coding (green/yellow/red)
- Strengths and Risks as bullet-pointed lists
- Best-suited scenario recommendation
- Reasoning section explaining why the score was given

