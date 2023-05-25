const inputBox = document.getElementById('input-box')
const listContainer = document.getElementById('list-container')

// Telegram scripts

const DemoApp = {
    initData: Telegram.WebApp.initData || '',
    initDataUnsafe: Telegram.WebApp.initDataUnsafe || {},
    MainButton: Telegram.WebApp.MainButton,

    init(options) {
        document.body.style.visibility = '';
        Telegram.WebApp.ready();
        Telegram.WebApp.MainButton.setParams({
            text: 'Close',
            is_visible: true
        }).onClick(DemoApp.close);
    },
    expand() {
        Telegram.WebApp.expand();
    },
    close() {
        Telegram.WebApp.close();
    },
    showAlert(message) {
        Telegram.WebApp.showAlert(message);
    },
    showConfirm(message, callback) {
        Telegram.WebApp.showConfirm(message, callback);
    },
    checkInitData() {
        const webViewStatus = document.querySelector('#webview_data_status');
        if (DemoApp.initDataUnsafe.query_id &&
            DemoApp.initData &&
            webViewStatus.classList.contains('status_need')
        ) {
            webViewStatus.classList.remove('status_need');
            DemoApp.apiRequest('checkInitData', {}, function (result) {
                if (result.ok) {
                    webViewStatus.textContent = 'Hash is correct (async)';
                    webViewStatus.className = 'ok';
                } else {
                    webViewStatus.textContent = result.error + ' (async)';
                    webViewStatus.className = 'err';
                }
            });
        }
    },

    sendText(spam) {
        const textField = document.querySelector('#text_field');
        const text = textField.value;
        if (!text.length) {
            return textField.focus();
        }
        if (byteLength(text) > 4096) {
            return alert('Text is too long');
        }

        const repeat = spam ? 10 : 1;
        for (let i = 0; i < repeat; i++) {
            Telegram.WebApp.sendData(text);
        }
    },
}

// DemoApp.checkInitData();
DemoApp.init();

function getFormData(object) {
    const formData = new FormData();
    Object.keys(object).forEach(key => formData.append(key, object[key]));
    return formData;
}

function apiRequest(method, data, onCallback) {
    const authData = Telegram.WebApp.initData || '';

    const options = {
        method: method,
        headers: {
            'tg-data': authData,
        }
    };



    let url = 'https://api.itodo.codepro.uz/api/task/';

    if (method == 'GET') {

        fetch(url, options)
            .then(response => {
                if (response.status === 200) {
                    return response.json()
                }
            })
            .then(response => {
                onCallback && onCallback(response);
            })
            .catch(err => {
                console.log(err);
            });
    } else if (method == 'POST') {
        const form = getFormData(data)
        options.body = form;

        fetch(url, options)
            .then(response => {
                if (response.status === 201) {
                    return response.json()
                } else {
                    DemoApp.showAlert("Task is not created!");
                    throw new Error('Server error!')
                }
            })
            .then(response => {
                onCallback && onCallback(response);
            })
            .catch(err => {
                console.log(err);
            });

    } else if (method == 'PATCH') {
        obj = data.obj
        const form = getFormData(obj)
        options.body = form;

        url = url + data.id + '/';

        fetch(url, options)
            .then(response => {
                if (response.status === 200) {
                    return response.json()
                } else {
                    alert("Task is not updated!");
                    throw new Error('Server error!')
                }
            })
            .then(response => {
                onCallback && onCallback(response);
            })
            .catch(err => {
                console.log(err);
            });
    } else if (method == 'DELETE') {
        url = url + data.id + '/';

        fetch(url, options)
            .then(response => {
                onCallback && onCallback(response);
            })
            .catch(err => {
                console.log(err);
            });
    }

}

function addTask() {
    if (inputBox.value === '') {
        alert('You must write something');
    }
    else {
        data = {
            title: inputBox.value
        }

        apiRequest("POST", data, (result) => {
            if (result) {
                appendTask(result)
            }

        })
    }

    inputBox.value = '';
}

listContainer.addEventListener("click", function (e) {
    if (e.target.tagName === "LI") {
        let is_done = e.target.classList.contains("checked");
        let id = e.target.id.replace('task-', '');

        let obj = {
            is_done: !is_done
        };

        let data = {
            id: id,
            obj: obj
        }

        apiRequest("PATCH", data, (result) => {
            if (result.is_done) {
                e.target.classList.add("checked");
            } else {
                e.target.classList.remove("checked");
            }
        });

    }
    else if (e.target.tagName === "SPAN") {
        let id = e.target.parentElement.id.replace('task-', '');
        let data = {
            id: id,
        }
        DemoApp.showConfirm("Do you want to delete the Task?", (result) => {
            if (result) {
                apiRequest("DELETE", data, (response) => {
                    if (response.status === 204) {
                        e.target.parentElement.remove();
                    }
                })
            }

        })

    }

}, false);


function appendTask(data) {
    let li = document.createElement("li");
    li.innerHTML = data.title;
    li.id = 'task-' + data.id;

    if (data.is_done) {
        li.classList.toggle("checked")
    }
    listContainer.appendChild(li);

    let span = document.createElement("span");
    span.innerHTML = '\u00d7';
    li.appendChild(span);
}

function showTask() {

    apiRequest("GET", {}, (res) => {
        results = res.results;



        results.forEach((result) => {
            appendTask(result)
        })
    })
}

function clickPress(event) {
    if (event.keyCode === 13) {
        addTask();
    }
}

showTask();
