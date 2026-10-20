# Resume Technical Glossary

This document explains every tool and technology mentioned in Michael Cogan's
technical resume, including how each one was actually used in a real project.
Provided so that a non-specialist reviewer can follow the resume with confidence.

---

## Languages

### C
A low-level programming language used for operating systems, embedded firmware,
and performance-critical software. Gives precise control over hardware memory
and timing.
**How it was used:** Foundational language in the embedded/systems coursework;
the basis for low-level systems thinking applied across hardware projects.

### C++
An extension of C that adds object-oriented and generic programming, widely used
for games, graphics, high-performance computing, and embedded systems.
**How it was used:** Primary language for the Atom Wavefunction Simulator, a 3D
graphics/visualization project using OpenGL and shaders.

### Python
A high-level, readable scripting language dominant in data science, automation,
web backends, and AI prototyping.
**How it was used:** Backbone of the Eigen AI system (orchestration, memory,
tool-calling), the Lagrangian oscillator simulator, and the NASA data analysis at
the research group. Also the automation layer throughout Eigen.

### JavaScript / TypeScript
JavaScript is the language of the web browser; TypeScript adds static typing for
larger, more reliable codebases.
**How it was used:** Front-end interactivity for the resume site and the
Pyodide-powered physics demo (JavaScript), plus general web work.

### HTML / CSS
HTML is the structure of a web page; CSS controls its appearance and layout.
**How it was used:** Built the resume/portfolio site and the public chat interface
for the Eigen demo, including a light/dark theme system.

### SQL
The language for querying relational databases.
**How it was used:** Schema design and queries in the Front Line Refinement
PostgreSQL backend and Eigen's SQLite episodic memory.

---

## Embedded & Systems

### Raspberry Pi / ARM-based single-board computers
Small, low-cost computers running Linux, commonly used for prototyping embedded
and robotics projects.
**How it was used:** Runs the sensory node of Eigen — a Raspberry Pi 5 connected
to a camera and a time-of-flight distance sensor that feeds the AI its "eyes."

### I2C
A two-wire serial bus protocol used to connect sensors and peripherals to a
microcontroller or single-board computer.
**How it was used:** The communication protocol between the Raspberry Pi and the
VL53L7CX time-of-flight sensor.

### Camera (CSI / OV5647)
The Camera Serial Interface (CSI) is how a camera attaches to a Raspberry Pi; the
OV5647 is a common 5MP camera module.
**How it was used:** Eigen's vision input — captures frames that a vision model
describes so Eigen can "see" its surroundings.

### Time-of-Flight (VL53L7CX) sensor
A sensor that measures distance by timing how long light takes to bounce off an
object and return. The VL53L7CX is an 8×8 grid version (64 measurement points).
**How it was used:** Always-on presence detection — wakes Eigen's camera pipeline
when something enters range, so it only processes meaningful events.

### Linux
An open-source operating system that powers servers, embedded devices, and most
of the internet.
**How it was used:** The operating system on the Dell workstation that hosts
Eigen, and the environment for the Atom simulator (Wayland/EGL) and Raspberry Pi.

### Bash / systemd
Bash is a command-line shell for scripting; systemd is the service manager that
starts and keeps system programs running in the background.
**How it was used:** Shell automation and `systemd` service units that run Eigen
and the Cloudflare Tunnel as always-on background services that survive reboots.

---

## Tools & Frameworks

### Git
A version-control system that tracks changes to code and enables collaboration.
**How it was used:** Version control for every project in the portfolio.

### GCC
The GNU Compiler Collection, the standard compiler for C and C++.
**How it was used:** Compiling the C++ Atom Wavefunction Simulator.

### Flask
A lightweight Python web framework for building web apps and APIs.
**How it was used:** Serves Eigen's web portal and public chat interface, and was
the backend for the 3D printing platform.

### Node.js / Express
Node.js runs JavaScript on the server; Express is a minimal web framework on top
of it.
**How it was used:** The backend of the Front Line Refinement site (routing,
forms, authentication, waivers, and booking).

### PostgreSQL / SQLite
PostgreSQL is a robust, full-featured relational database; SQLite is a lightweight
single-file embedded database.
**How it was used:** PostgreSQL (via Neon's managed hosting) stores Front Line's
content, users, waivers, appointments, and sessions. SQLite stores Eigen's
episodic "event log" memory.

### ChromaDB
A vector database that stores embeddings (numerical representations of text) and
retrieves them by semantic similarity rather than exact keyword match.
**How it was used:** Eigen's semantic memory — lets it recall relevant past
experiences based on meaning, not just keywords.

### Ollama
A runtime for running large language models (LLMs) entirely on local hardware.
**How it was used:** Runs the Qwen2.5 and Moondream models that power Eigen's
text and vision reasoning on the local GPU.

### OpenGL / GLSL
OpenGL is a graphics API; GLSL is its shader language for programming the GPU.
**How it was used:** Real-time GPU ray-marching in the Atom Wavefunction
Simulator to render 3D probability density grids.

### Pyodide / WebAssembly
Pyodide compiles Python to run in the browser via WebAssembly, so no backend
server is needed.
**How it was used:** Runs the SciPy oscillator solver directly in the browser for
the physics demo.

### SciPy / NumPy / Pandas / Matplotlib
The core Python scientific stack: NumPy (fast arrays), SciPy (algorithms like
differential-equation solvers), Pandas (tabular data), Matplotlib (charts).
**How it was used:** SciPy's `solve_ivp` solves the oscillator differential
equations; NumPy/Matplotlib processed and visualized NASA data; Pandas was used
for structured data work.

---

## Concepts

### RTOS fundamentals
A Real-Time Operating System guarantees tasks complete within strict timing
deadlines — essential for embedded control systems.
**How it was used:** Studied as part of the embedded/computer-systems coursework;
informs the design of Eigen's event-driven sensing loop.

### Device drivers / interrupts
Drivers let the OS talk to hardware; interrupts let hardware signal the CPU
immediately instead of waiting to be polled.
**How it was used:** Concepts applied when integrating sensors (camera, ToF) with
the Raspberry Pi in Eigen.

### Memory management / multithreading
Controlling how a program uses RAM and running tasks concurrently.
**How it was used:** Eigen's sliding-window context manager and threaded
rate-limiting/geolocation — keeping a long-running process responsive without
exhausting memory.

### Computer architecture / digital systems / circuit analysis
Foundational electrical/computer engineering coursework covering how processors,
logic circuits, and electronic components work.
**How it was used:** The academic basis for the B.S. in Electrical &amp; Computer
Engineering Technology.
