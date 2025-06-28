
let isFetching = false;
let hasMoreMessages = true;

function getCookie(name) {
    return document.cookie
        .split('; ')
        .find(row => row.startsWith(name + '='))
        ?.split('=')[1] || null;
}

async function loadMessages() {
    if (isFetching || !hasMoreMessages) return;
    isFetching = true;

    const container = document.getElementById('messages-container');
    const offset = container.querySelectorAll('.message').length;

    const res = await fetch(`/api/messages?offset=${offset}`);

    console.log(res);
    if (res.ok) {
        const data = await res.json();
        if(data.messages.length === 0) {
            hasMoreMessages = false;
            isFetching = false;
            return;
        }

        const fragment = document.createDocumentFragment();

        data.messages.forEach(m => {
            const messageEl = createMessageEl(m);
            fragment.appendChild(messageEl);
        });

        container.prepend(fragment);
    }

    isFetching = false;
}

function createMessageEl(m) {
    const messageEl = document.createElement('div');
    const isOwnMessage = m.sender === getCookie('name');

    messageEl.classList.add('message');
    if(isOwnMessage) messageEl.classList.add('own-message');

    messageEl.innerHTML = `
        ${!isOwnMessage ? `<h5 class="sender}">${m.sender}</h5>` : ''}
        <div class="message-content">${m.text}</div>
        <div class="time-ago">${timeAgo(m.date)}</div>
    `;

    return messageEl;
}

function scrollToDown() {
    const wrapper = document.getElementById('messages-wrapper');
    wrapper.scrollTo({ top: wrapper.scrollHeight, behavior: 'smooth' });
}

function timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    const intervals = [
        { label: "year", seconds: 31536000 },
        { label: "month", seconds: 2592000 },
        { label: "day", seconds: 86400 },
        { label: "hour", seconds: 3600 },
        { label: "minute", seconds: 60 },
        { label: "second", seconds: 1 }
    ];

    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count > 0) {
            let label;
            let ago = "тому";


            switch (interval.label) {
                case "year":
                    if (count % 10 === 1 && count % 100 !== 11) label = "рік";
                    else if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) label = "роки";
                    else label = "років";
                    break;

                case "month":
                    if (count === 1) label = "місяць";
                    else if (count >= 2 && count <= 4) label = "місяці";
                    else label = "місяців";
                    break;

                case "day":
                    if (count === 1) label = "день";
                    else if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) label = "дні";
                    else label = "днів";
                    break;

                case "hour":
                    if (count % 10 === 1 && count % 100 !== 11) label = "годину";
                    else if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) label = "години";
                    else label = "годин";
                    break;

                case "minute":
                    if (count % 10 === 1 && count % 100 !== 11) label = "хвилину";
                    else if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) label = "хвилини";
                    else label = "хвилин";
                    break;

                case "second":
                    if (count % 10 === 1 && count % 100 !== 11) label = "секунду";
                    else if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) label = "секунди";
                    else label = "секунд";
                    break;
            }

            return `${count} ${label} ${ago}`;
        }
    }

    return "щойно";
}


document.addEventListener("DOMContentLoaded", async () => {
    const socket = new WebSocket('ws://192.168.0.105:3000');

    socket.addEventListener('open', () => {
        console.log('WebSocket зʼєднання встановлено');
    });

    socket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        const container = document.getElementById('messages-container');

        if(data.type === "new message") {
            const messageEl = createMessageEl(data.message);
            container.appendChild(messageEl);
            scrollToDown();
        } else if(data.type === "get messages") {
            const fragment = document.createDocumentFragment();
            data.messages.forEach((m) => {
                const messageEl = createMessageEl(m);
                fragment.appendChild(messageEl);
            })
            container.prepend(fragment);
            
            const wrapper = document.getElementById('messages-wrapper');
            wrapper.scroll(0, wrapper.scrollHeight);
        }
    });

    socket.addEventListener('close', () => {
        console.log('Зʼєднання закрито');
    });

    socket.addEventListener('error', (error) => {
        console.error('Сталася помилка:', error);
    });


    
    try {
        const modal = document.getElementById('set-name-modal');
        const nameInput = document.getElementById('name-input');
        const setNameBtn = document.getElementById('set-name-btn');

        if(!getCookie('name')) {
            modal.removeAttribute('hidden');
        }

        const saveName = () => {
            if(!nameInput.value.trim()) return;
            document.cookie = `name=${nameInput.value}`;
            modal.setAttribute('hidden', '');
        }

        nameInput.addEventListener("input", function (e) {
            if(nameInput.value.trim()) setNameBtn.classList.add('done');
            else setNameBtn.classList.remove('done');
        });

        nameInput.addEventListener("keydown", function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                e.preventDefault();
                saveName();
            }
        });

        setNameBtn.addEventListener("click", saveName);
    } catch (error) {
        console.error(error);
    }


    try {
        document.addEventListener("input", function (event) {
            if (event.target.matches(".textarea-autosize")) {
                const textarea = event.target;
                textarea.style.height = "auto";
                textarea.style.height = textarea.scrollHeight + "px";
            }
        });
    } catch (error) {
        console.error(error);
    }


    try {
        document.getElementById('send-btn').addEventListener("click", async function (event) {
            const container = document.getElementById('messages-container');
            const textarea = document.getElementById('message-textarea');
            const text = textarea.value;

            if (!text.trim()) return;

            socket.send(JSON.stringify({
                type: "send message",
                name: getCookie('name'),
                text
            }));
            
            textarea.value = '';
            textarea.style.height = textarea.scrollHeight + "px";
            scrollToDown();
        });
    } catch (error) {
        console.error(error);
    }

    try {
        const wrapper = document.getElementById('messages-wrapper');

        wrapper.addEventListener('scroll', (event) => {
            if(wrapper.scrollTop <= 100) loadMessages();
        })
    } catch (error) {
        console.error(error);
    }

})