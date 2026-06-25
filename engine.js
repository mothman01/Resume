// engine.js - Handles client-side WebAssembly Python execution
let pyodide = null;

async function initPythonEngine() {
    if (pyodide) return;
    
    // Load the Pyodide runtime environment via CDN
    pyodide = await loadPyodide();
    
    // Download and inject NumPy and SciPy components into the sandbox
    await pyodide.loadPackage(['numpy', 'scipy']);
    
    // Define your exact python backend code as standard strings
    const modelPy = `
import numpy as np
from scipy.signal import square

def simple_harmonic(t, state, omega, m=1.0):
    x, v = state
    return [v, -(omega**2) * x]

def damped_oscillator(t, state, omega, gamma, m=1.0):
    x, v = state
    return [v, -2 * gamma * v - omega**2 * x]

def forced_oscillator(t, state, omega, gamma, F, omega_drive, m=1.0):
    x, v = state
    return [v, -2 * gamma * v - omega**2 * x + (F / m) * np.cos(omega_drive * t)]

def rectangular_oscillator(t, state, omega, gamma, F, omega_drive, m=1.0):
    x, v = state
    return [v, -2 * gamma * v - omega**2 * x + (F / m) * square(omega_drive * t)]
`;

    const solverPy = `
from scipy.integrate import solve_ivp
import numpy as np

def solve(model, params, x0, v0, t_max=50, n_points=2000, fast=False):
    t_span = (0, t_max)
    t_eval = np.linspace(*t_span, n_points)
    state0 = [x0, v0]
    
    sol = solve_ivp(
        fun=lambda t, y: model(t, y, **params),
        t_span=t_span,
        y0=state0,
        t_eval=t_eval,
        method='RK45',
        rtol=1e-4 if fast else 1e-8,
        atol=1e-6 if fast else 1e-10
    )
    return sol.t.tolist(), sol.y[0].tolist(), sol.y[1].tolist()
`;

    // Execute the scripts within the localized environment
    await pyodide.runPythonAsync(modelPy);
    await pyodide.runPythonAsync(solverPy);
}

// Replaces your original async sendRequest() fetch call in main.js
async function calculateWasmOscillation(params) {
    await initPythonEngine();
    
    // Expose parameters directly to our embedded python execution context
    pyodide.globals.set("mode", params.mode);
    pyodide.globals.set("F0", parseFloat(params.F0));
    pyodide.globals.set("w_d", parseFloat(params.omega_drive));
    pyodide.globals.set("x0", parseFloat(params.x0));
    pyodide.globals.set("m", parseFloat(params.m));

    const computationScript = `
# Map client string commands to structural solver targets
model_map = {
    'simple': simple_harmonic,
    'damped': damped_oscillator,
    'forced': forced_oscillator,
    'rectangular': rectangular_oscillator
}

omega0 = 2.0
beta = 0.2

if mode == 'simple':
    p = {'omega': omega0, 'm': m}
elif mode == 'damped':
    p = {'omega': omega0, 'gamma': beta, 'm': m}
else:
    p = {'omega': omega0, 'gamma': beta, 'F': F0, 'omega_drive': w_d, 'm': m}

# Execute solver directly inside the browser engine
t, x, v = solve(model_map[mode], p, x0=x0, v0=0.0)
import json
json.dumps({'t': t, 'x': x, 'v': v})
`;

    const resultString = await pyodide.runPythonAsync(computationScript);
    return JSON.parse(resultString);
}
