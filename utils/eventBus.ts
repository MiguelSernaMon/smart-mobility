// Sistema simple de EventBus
export const createEventListener = (eventName: string, callback: () => void): () => void => {
  if (!global[`${eventName}Listeners`]) {
    global[`${eventName}Listeners`] = [];
  }
  
  global[`${eventName}Listeners`].push(callback);
  
  // Función para eliminar el listener
  return () => {
    const index = global[`${eventName}Listeners`].indexOf(callback);
    if (index !== -1) {
      global[`${eventName}Listeners`].splice(index, 1);
    }
  };
};

export const emitEvent = (eventName: string) => {
  if (global[`${eventName}Listeners`]) {
    global[`${eventName}Listeners`].forEach(callback => callback());
  }
};