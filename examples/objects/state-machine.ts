/**
 * State machine inference examples
 *
 * PTL infers state transition types and action payloads.
 */

// Simple state machine
function createMachine(config) {
  let currentState = config.initial;
  const listeners = new Set();

  function transition(event) {
    const stateConfig = config.states[currentState];
    if (!stateConfig) {
      throw new Error(`Invalid state: ${currentState}`);
    }

    const nextState = stateConfig.on?.[event];
    if (!nextState) {
      return currentState; // No transition for this event
    }

    const previousState = currentState;
    currentState = nextState;

    // Run exit/enter actions
    stateConfig.exit?.();
    config.states[currentState]?.entry?.();

    // Notify listeners
    for (const listener of listeners) {
      listener({ from: previousState, to: currentState, event });
    }

    return currentState;
  }

  function getState() {
    return currentState;
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function matches(state) {
    return currentState === state;
  }

  // Run initial entry action
  config.states[currentState]?.entry?.();

  return {
    transition,
    getState,
    subscribe,
    matches,
  };
}

// Traffic light state machine
const trafficLightMachine = createMachine({
  initial: 'green',
  states: {
    green: {
      on: { TIMER: 'yellow' },
      entry: () => console.log('Light is green'),
    },
    yellow: {
      on: { TIMER: 'red' },
      entry: () => console.log('Light is yellow'),
    },
    red: {
      on: { TIMER: 'green' },
      entry: () => console.log('Light is red'),
    },
  },
});

// Fetch state machine
const fetchMachine = createMachine({
  initial: 'idle',
  states: {
    idle: {
      on: { FETCH: 'loading' },
    },
    loading: {
      on: {
        SUCCESS: 'success',
        ERROR: 'error',
      },
      entry: () => console.log('Fetching...'),
    },
    success: {
      on: { RESET: 'idle' },
      entry: () => console.log('Fetch succeeded'),
    },
    error: {
      on: {
        RETRY: 'loading',
        RESET: 'idle',
      },
      entry: () => console.log('Fetch failed'),
    },
  },
});

// Reducer-based state machine
function createReducerMachine(reducer, initialState) {
  let state = initialState;
  const listeners = new Set();

  function dispatch(action) {
    const nextState = reducer(state, action);
    if (nextState !== state) {
      state = nextState;
      for (const listener of listeners) {
        listener(state, action);
      }
    }
    return state;
  }

  function getState() {
    return state;
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return { dispatch, getState, subscribe };
}

// Todo reducer
function todoReducer(state, action) {
  switch (action.type) {
    case 'ADD_TODO':
      return {
        ...state,
        todos: [
          ...state.todos,
          {
            id: Date.now(),
            text: action.payload.text,
            completed: false,
          },
        ],
      };

    case 'TOGGLE_TODO':
      return {
        ...state,
        todos: state.todos.map((todo) =>
          todo.id === action.payload.id ? { ...todo, completed: !todo.completed } : todo
        ),
      };

    case 'REMOVE_TODO':
      return {
        ...state,
        todos: state.todos.filter((todo) => todo.id !== action.payload.id),
      };

    case 'SET_FILTER':
      return {
        ...state,
        filter: action.payload.filter,
      };

    default:
      return state;
  }
}

const todoMachine = createReducerMachine(todoReducer, {
  todos: [],
  filter: 'all',
});

export {
  createMachine,
  trafficLightMachine,
  fetchMachine,
  createReducerMachine,
  todoReducer,
  todoMachine,
};
