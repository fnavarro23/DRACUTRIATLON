document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const registrationForm = document.getElementById('registration-form');
    const startEventBtn = document.getElementById('start-event');
    const resetEventBtn = document.getElementById('reset-event');
    const randomParticipantsBtn = document.getElementById('random-participants');
    const resultsBody = document.getElementById('results-body');
    const timerDisplay = document.getElementById('timer');
    const startTimeInput = document.getElementById('start-time');
    const speedModeSelect = document.getElementById('speed-mode');

    // Estado del evento
    let participants = [];
    let eventStarted = false;
    let currentTime = "08:00:00";
    let eventInterval = null;
    let simulationSpeed = 1000; // Velocidad normal (1 segundo real = 1 segundo simulado)
    const walkingSpeed = 7; // km/h
    const swimmingSpeed = 1.72; // m/s (convertido a km/s en el código)
    const cyclingSpeed = 45; // km/h

    // Nombres y ciudades aleatorias para generación automática
    const randomNames = [
        "Juan Pérez", "María García", "Carlos López", "Ana Martínez", "Luis Rodríguez",
        "Sofía Hernández", "Diego González", "Valentina Díaz", "Jorge Sánchez", "Camila Ramírez",
        "Andrés Torres", "Isabella Flores", "Miguel Álvarez", "Lucía Ruiz", "Fernando Castro"
    ];

    const randomCities = [
        "Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena",
        "Bucaramanga", "Pereira", "Manizales", "Armenia", "Ibagué",
        "Santa Marta", "Villavicencio", "Pasto", "Montería", "Valledupar"
    ];

    // Registrar participante
    registrationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (eventStarted) {
            alert('¡El evento ya comenzó! No se pueden registrar más participantes.');
            return;
        }
        
        const participant = {
            cedula: document.getElementById('cedula').value,
            nombre: document.getElementById('nombre').value,
            municipio: document.getElementById('municipio').value,
            edad: parseInt(document.getElementById('edad').value),
            walking: { distance: 0, completed: false, startTime: null, endTime: null },
            swimming: { distance: 0, completed: false, startTime: null, endTime: null },
            cycling: { distance: 0, completed: false, startTime: null, endTime: null },
            disqualified: false,
            reason: ''
        };
        
        participants.push(participant);
        updateResultsTable();
        registrationForm.reset();
    });

    // Generar participantes aleatorios
    randomParticipantsBtn.addEventListener('click', function() {
        if (eventStarted) {
            alert('No se pueden agregar participantes durante el evento');
            return;
        }

        for (let i = 0; i < 10; i++) {
            const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
            const randomCity = randomCities[Math.floor(Math.random() * randomCities.length)];
            const randomAge = Math.floor(Math.random() * 20) + 18; // Edad entre 18 y 38
            const randomId = Math.floor(Math.random() * 90000000) + 10000000; // ID de 8 dígitos

            const participant = {
                cedula: randomId.toString(),
                nombre: randomName,
                municipio: randomCity,
                edad: randomAge,
                walking: { distance: 0, completed: false, startTime: null, endTime: null },
                swimming: { distance: 0, completed: false, startTime: null, endTime: null },
                cycling: { distance: 0, completed: false, startTime: null, endTime: null },
                disqualified: false,
                reason: ''
            };
            
            participants.push(participant);
        }
        
        updateResultsTable();
    });

    // Iniciar evento
    startEventBtn.addEventListener('click', function() {
        if (eventStarted) return;
        
        const startTime = startTimeInput.value;
        if (!isValidTime(startTime)) {
            alert('Por favor ingresa una hora válida en formato HH:MM:SS');
            return;
        }
        
        if (participants.length === 0) {
            alert('¡No hay participantes registrados!');
            return;
        }
        
        // Configurar velocidad de simulación
        simulationSpeed = speedModeSelect.value === 'rapid' ? 100 : 1000;
        
        // Inicializar evento
        eventStarted = true;
        currentTime = startTime;
        timerDisplay.textContent = `⏱️ Hora: ${currentTime}`;
        
        // Establecer hora de inicio para todos los participantes
        participants.forEach(participant => {
            participant.walking.startTime = currentTime;
        });
        
        // Iniciar simulación
        eventInterval = setInterval(updateEvent, simulationSpeed);
        startEventBtn.disabled = true;
    });

    // Reiniciar evento
    resetEventBtn.addEventListener('click', function() {
        clearInterval(eventInterval);
        participants = [];
        eventStarted = false;
        currentTime = "08:00:00";
        timerDisplay.textContent = `⏱️ Hora: ${currentTime}`;
        startTimeInput.value = "08:00:00";
        updateResultsTable();
        startEventBtn.disabled = false;
    });

    // Actualizar estado del evento
    function updateEvent() {
        // Actualizar hora actual
        currentTime = addOneSecond(currentTime);
        timerDisplay.textContent = `⏱️ Hora: ${currentTime}`;
        
        // Actualizar progreso de cada participante
        participants.forEach(participant => {
            if (participant.disqualified) return;
            
            // Caminata (10K)
            if (!participant.walking.completed) {
                updateDiscipline(participant, 'walking', 10, walkingSpeed);
            } 
            // Natación (10K) - comienza cuando termina la caminata
            else if (!participant.swimming.completed && participant.walking.completed) {
                if (!participant.swimming.startTime) {
                    participant.swimming.startTime = participant.walking.endTime;
                }
                updateDiscipline(participant, 'swimming', 10, swimmingSpeed * 3.6); // Convertir m/s a km/h
            } 
            // Ciclismo (30K) - comienza cuando termina la natación
            else if (!participant.cycling.completed && participant.swimming.completed) {
                if (!participant.cycling.startTime) {
                    participant.cycling.startTime = participant.swimming.endTime;
                }
                updateDiscipline(participant, 'cycling', 30, cyclingSpeed);
            }
        });
        
        updateResultsTable();
        
        // Verificar si todos los participantes han terminado o están descalificados
        const eventFinished = participants.every(p => 
            p.cycling.completed || p.disqualified
        );
        
        if (eventFinished) {
            clearInterval(eventInterval);
            alert('¡El triatlón ha terminado! 🎉');
        }
    }

    // Actualizar una disciplina específica
    function updateDiscipline(participant, discipline, maxDistance, speed) {
        // Calcular distancia máxima que puede recorrer en 1 segundo (en km)
        const maxDistancePerSecond = speed / 3600;
        
        // Distancia aleatoria recorrida este segundo (0 a máximo posible)
        const distanceThisSecond = Math.random() * maxDistancePerSecond;
        
        // Verificar descalificación (menos de 1 metro)
        if (distanceThisSecond < 0.001) {
            participant.disqualified = true;
            participant.reason = `Descalificado en ${discipline} (distancia muy baja)`;
            return;
        }
        
        // Actualizar distancia
        participant[discipline].distance += distanceThisSecond;
        
        // Verificar si completó la disciplina
        if (participant[discipline].distance >= maxDistance) {
            participant[discipline].completed = true;
            participant[discipline].endTime = currentTime;
            participant[discipline].distance = maxDistance; // Ajustar al máximo
        }
    }

    // Actualizar tabla de resultados
    function updateResultsTable() {
        // Ordenar participantes: los que llevan más recorrido en menos tiempo primero
        const sortedParticipants = [...participants].sort((a, b) => {
            // Descalificados al final
            if (a.disqualified && !b.disqualified) return 1;
            if (!a.disqualified && b.disqualified) return -1;
            if (a.disqualified && b.disqualified) return 0;
            
            // Comparar ciclismo primero
            if (a.cycling.completed && !b.cycling.completed) return -1;
            if (!a.cycling.completed && b.cycling.completed) return 1;
            if (a.cycling.completed && b.cycling.completed) {
                return timeToSeconds(a.cycling.endTime) - timeToSeconds(b.cycling.endTime);
            }
            
            // Luego natación
            if (a.swimming.completed && !b.swimming.completed) return -1;
            if (!a.swimming.completed && b.swimming.completed) return 1;
            if (a.swimming.completed && b.swimming.completed) {
                // Comparar distancia en ciclismo si ambos están en esa disciplina
                if (!a.cycling.completed && !b.cycling.completed) {
                    return b.cycling.distance - a.cycling.distance;
                }
                return timeToSeconds(a.swimming.endTime) - timeToSeconds(b.swimming.endTime);
            }
            
            // Luego caminata
            if (a.walking.completed && !b.walking.completed) return -1;
            if (!a.walking.completed && b.walking.completed) return 1;
            if (a.walking.completed && b.walking.completed) {
                // Comparar distancia en natación si ambos están en esa disciplina
                if (!a.swimming.completed && !b.swimming.completed) {
                    return b.swimming.distance - a.swimming.distance;
                }
                return timeToSeconds(a.walking.endTime) - timeToSeconds(b.walking.endTime);
            }
            
            // Ambos todavía caminando - comparar distancia
            return b.walking.distance - a.walking.distance;
        });
        
        // Generar filas de la tabla
        let html = '';
        sortedParticipants.forEach((participant, index) => {
            const position = index + 1;
            
            html += `<tr class="${participant.disqualified ? 'disqualified' : ''}">`;
            html += `<td>${participant.disqualified ? '🚫' : position}</td>`;
            html += `<td>${participant.nombre}</td>`;
            html += `<td>${participant.cedula}</td>`;
            html += `<td>${participant.municipio}</td>`;
            html += `<td>${participant.edad}</td>`;
            
            // Info caminata
            html += `<td>`;
            if (participant.walking.startTime) {
                html += `🏁 ${participant.walking.startTime}<br>`;
                if (participant.walking.completed) {
                    html += `✅ ${participant.walking.endTime}<br>`;
                    html += `⏱️ ${calculateTimeDifference(participant.walking.startTime, participant.walking.endTime)}`;
                } else if (participant.disqualified) {
                    html += `❌ Descalificado`;
                } else {
                    html += `🔄 ${(participant.walking.distance / 10 * 100).toFixed(1)}%`;
                }
            } else {
                html += `⏳ No iniciado`;
            }
            html += `</td>`;
            
            // Info natación
            html += `<td>`;
            if (participant.swimming.startTime) {
                html += `🏁 ${participant.swimming.startTime}<br>`;
                if (participant.swimming.completed) {
                    html += `✅ ${participant.swimming.endTime}<br>`;
                    html += `⏱️ ${calculateTimeDifference(participant.swimming.startTime, participant.swimming.endTime)}`;
                } else if (participant.disqualified) {
                    html += `❌ Descalificado`;
                } else {
                    html += `🔄 ${(participant.swimming.distance / 10 * 100).toFixed(1)}%`;
                }
            } else if (participant.walking.completed || participant.disqualified) {
                html += participant.disqualified ? '❌ Descalificado' : '⏳ No iniciado';
            } else {
                html += `⌛ Esperando caminata`;
            }
            html += `</td>`;
            
            // Info ciclismo
            html += `<td>`;
            if (participant.cycling.startTime) {
                html += `🏁 ${participant.cycling.startTime}<br>`;
                if (participant.cycling.completed) {
                    html += `✅ ${participant.cycling.endTime}<br>`;
                    html += `⏱️ ${calculateTimeDifference(participant.cycling.startTime, participant.cycling.endTime)}`;
                } else if (participant.disqualified) {
                    html += `❌ Descalificado`;
                } else {
                    html += `🔄 ${(participant.cycling.distance / 30 * 100).toFixed(1)}%`;
                }
            } else if (participant.swimming.completed || participant.disqualified) {
                html += participant.disqualified ? '❌ Descalificado' : '⏳ No iniciado';
            } else {
                html += `⌛ Esperando natación`;
            }
            html += `</td>`;
            
            // Estado
            html += `<td class="status">`;
            if (participant.disqualified) {
                html += `<span class="disqualified">🚫 Descalificado</span><br><small>${participant.reason}</small>`;
            } else if (participant.cycling.completed) {
                html += `<span class="completed">🏅 Completado</span>`;
            } else {
                html += `<span class="in-progress">🏃‍♂️ En progreso</span>`;
            }
            html += `</td>`;
            
            html += `</tr>`;
        });
        
        resultsBody.innerHTML = html;
    }

    // Funciones auxiliares
    function isValidTime(time) {
        return /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.test(time);
    }

    function addOneSecond(time) {
        let [hours, minutes, seconds] = time.split(':').map(Number);
        seconds++;
        
        if (seconds >= 60) {
            seconds = 0;
            minutes++;
        }
        if (minutes >= 60) {
            minutes = 0;
            hours++;
        }
        if (hours >= 24) {
            hours = 0;
        }
        
        return [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            seconds.toString().padStart(2, '0')
        ].join(':');
    }

    function timeToSeconds(time) {
        const [hours, minutes, seconds] = time.split(':').map(Number);
        return hours * 3600 + minutes * 60 + seconds;
    }

    function calculateTimeDifference(start, end) {
        const diff = timeToSeconds(end) - timeToSeconds(start);
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
});