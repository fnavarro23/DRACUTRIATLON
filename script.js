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
    const inicioEL = document.getElementById('iniciar');
     // Actualiza el campo de hora cada segundo
    
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
        console.log(startTime);
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

        // Actuallizar tabla con participantes activos

        getCheckedParticipants();
        
        // Establecer hora de inicio para todos los participantes
        participants.forEach(participant => {
            participant.walking.startTime = currentTime;
        });
        
        // Iniciar simulación
        eventInterval = setInterval(updateEvent, simulationSpeed);
        startEventBtn.disabled = true;
    });
    inicioEL.addEventListener('click', function() {
        const checkbox = document.getElementById('chack_participantes');
        let check = "";
        console.log(participants);
        participants.forEach((participant, index) => {
            check += `
            <div class="form-check" style="margin-left: 20px;font-weight: 600;">
                <input class="form-check-input my-1" type="checkbox" value="${index}" id="participant-${index}">
                <label class="form-check-label" for="participant-${index}">
                    ${participant.nombre} - ${participant.cedula}
                </label>
            </div>
            `;
        });
        checkbox.innerHTML = check;
    });

    function getCheckedParticipants() {
        const checkboxes = document.querySelectorAll('.form-check-input');
        const checkedParticipants = [];
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const participantIndex = parseInt(checkbox.value, 10);
                checkedParticipants.push(participants[participantIndex]);
            }
        });
        participants = checkedParticipants;
        updateResultsTable();
    }


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
    // Actualizar estado del evento
function updateEvent() {
    // Actualizar hora actual
    console.log("hola");
    currentTime = addOneSecond(currentTime); // Incrementa el tiempo simulado en 1 segundo
    timerDisplay.textContent = `⏱️ Hora: ${currentTime}`; // Actualiza el reloj en pantalla
    
    // Actualizar progreso de cada participante
    participants.forEach(participant => {
        if (participant.disqualified) return; // Si el participante está descalificado, no se actualiza
        
        // Caminata (10K)
        if (!participant.walking.completed) {
            updateDiscipline(participant, 'walking', 10000, walkingSpeed); // Actualiza el progreso en la caminata
        } 
        // Natación (10K) - comienza cuando termina la caminata
        else if (!participant.swimming.completed && participant.walking.completed) {
            if (!participant.swimming.startTime) {
                participant.swimming.startTime = participant.walking.endTime; // Registra la hora de inicio de la natación
            }
            updateDiscipline(participant, 'swimming', 10000, swimmingSpeed * 3.6); // Actualiza el progreso en la natación (convertido a km/h)
        } 
        // Ciclismo (30K) - comienza cuando termina la natación
        else if (!participant.cycling.completed && participant.swimming.completed) {
            if (!participant.cycling.startTime) {
                participant.cycling.startTime = participant.swimming.endTime; // Registra la hora de inicio del ciclismo
            }
            updateDiscipline(participant, 'cycling', 30000, cyclingSpeed); // Actualiza el progreso en el ciclismo
        }
    });
    
    updateResultsTable(); // Actualiza la tabla de resultados en pantalla
    
    // Verificar si todos los participantes han terminado o están descalificados
    const eventFinished = participants.every(p => 
        p.cycling.completed || p.disqualified // Verifica si todos han completado o están descalificados
    );
    
    if (eventFinished) {
        clearInterval(eventInterval); // Detiene la simulación

        // Cambiar color de las tres primeras filas a rojo
        const rows = resultsBody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            if (index < 3){

                row.style.color= 'white'; 
            }
            switch (index) {
                case 0:
                    // Cambia el color del texto a blanco
                    row.style.backgroundColor = '#F0E68C'; // Primer lugar
                    break;
                case 1:
                    row.style.backgroundColor = '#D3D3D3'; // Segundo lugar
                    break;
                case 2:
                    row.style.backgroundColor = '#D2691E'; // Tercer lugar
                    break;
            }  
        });

        alert('¡El triatlón ha terminado! 🎉'); // Muestra un mensaje de finalización
    }
}

// Actualizar una disciplina específica
function updateDiscipline(participant, discipline, maxDistance, speed) {
    // Calcular distancia máxima que puede recorrer en 1 segundo (en km)
    const maxDistancePerSecond = (speed*1000) / 3600; // Velocidad está en km/h, se convierte a km/s
    
    // Distancia aleatoria recorrida este segundo (0 a máximo posible)
    const distanceThisSecond = Math.random() * maxDistancePerSecond; // Ensure minimum distance is 1 meter
    
    // Verificar descalificación (menos de 1 metro)
    if (distanceThisSecond < 0.001) { // This condition is now redundant but kept for clarity
        participant.disqualified = true; // Marca al participante como descalificado
        participant.reason = `Descalificado en ${discipline} (distancia muy baja)`; // Razón de descalificación
        return;
    }
    console.log(distanceThisSecond);
    // Actualizar distancia
    participant[discipline].distance += distanceThisSecond; // Incrementa la distancia recorrida

    // Verificar si completó la disciplina
    if (participant[discipline].distance >= maxDistance / 1000) { // maxDistance está en metros, se convierte a km
        participant[discipline].completed = true; // Marca la disciplina como completada
        participant[discipline].endTime = currentTime; // Registra la hora de finalización
        participant[discipline].distance = maxDistance / 1000; // Ajusta la distancia al máximo permitido en km
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