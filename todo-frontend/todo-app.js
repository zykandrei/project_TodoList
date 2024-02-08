(function () {
  //создаём и возвращаем заголовок приложения
  function createAppTitle(title) {
    let appTitle = document.createElement('h2');
    appTitle.innerHTML = title;
    return appTitle;
  };

  // создаём и возвращаем форму для создания дела
  function createTodoItemForm() {
    let form = document.createElement('form');
    let input = document.createElement('input');
    let buttonWrapper = document.createElement('div');
    let button = document.createElement('button');

    form.classList.add('input-group', 'mb-3');
    input.classList.add('form-control');
    input.placeholder = 'Введите название нового дела'
    buttonWrapper.classList.add('input-group-append');
    button.classList.add('btn', 'btn-primary');
    button.textContent = 'Добавить дело';

    buttonWrapper.append(button);
    form.append(input);
    form.append(buttonWrapper);

    return {
      form,
      input,
      button,
    }
  };

  // сщздаём и возвращаем список элементов
  function createTodoList() {
    let list = document.createElement('ul');
    list.classList.add('list-group');
    return list;
  };

  function createTodoItemElement(todoItem, { onDone, onDelete }) {
    let doneClass = 'list-group-item-success';
    let item = document.createElement('li');
    // кнопки помещаем в элемент, который красиво покажет их в одном блоке
    let buttonGroup = document.createElement('div');
    let doneButton = document.createElement('button');
    let deletButton = document.createElement('button');

    // устанавливаем стили для элемента списка, а также для размещения кнопок
    // в его правой части с помощью flex
    item.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
    //// проверка которая проставит элементу дела свойство как сделанное
    if (todoItem.done) {
      item.classList.add(doneClass);
    }
    item.textContent = todoItem.name;

    buttonGroup.classList.add('btn-group', 'btn-group-sm');
    doneButton.classList.add('btn', 'btn-success');
    doneButton.textContent = 'Готово';
    deletButton.classList.add('btn', 'btn-danger');
    deletButton.textContent = 'Удалить';

    // добовляем обработчик на кнопки
    //// действия которые должны происходить при клике на кнопки передадим в качестве аргументов в функию createTodoItemElement
    //// чтобы не ломать логику и не размазывать взаимодействие с сервером по разным местам в приложении
    //// если мы захотим переиспользовать код для другого API или вместо API будем использовать ЛоколСторейдж - придется писать
    //// несколько разных функций для созания дела  Нам необходимо отделить код представления информации от кода над монипуляциями о данных
    doneButton.addEventListener('click', () => {
      onDone({ todoItem, element: item });
      item.classList.toggle(doneClass, todoItem.done);
    });

    deletButton.addEventListener('click', () => {
      onDelete({ todoItem, element: item });
      
    });

    // вкладываем кнопки в отдельный элемент, чтобы они объединились в один блок
    buttonGroup.append(doneButton);
    buttonGroup.append(deletButton);
    item.append(buttonGroup);

    return item;
  };

  async function createTodoApp(container, title, owner) {
    let todoAppTitle = createAppTitle(title);
    let todoItemForm = createTodoItemForm();
    let todoList = createTodoList();
    //// создаём те самые функии (обработчики) для запроса на сервер по действиям(изменениям) с делами.
    let handlers = {
      onDone({ todoItem }) {
        todoItem.done = !todoItem.done
        fetch(`http://localhost:3000/api/todos/${todoItem.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ done: todoItem.done }),
          headers: {
            'Content-Type': 'application/json',
          }
        });
      },
      onDelete({ todoItem, element }) {
        if (!confirm('Вы уверены?')) {
          return;
        }
        element.remove();
        fetch(`http://localhost:3000/api/todos/${todoItem.id}`, {
          method: 'DELETE',
        });
      },  
    };

    container.append(todoAppTitle);
    container.append(todoItemForm.form);
    container.append(todoList);

    //// отправляем запрос на список всех дел (перезагрузка страницы)
    const response = await fetch(`http://localhost:3000/api/todos?owner=${owner}`);
    const todoItemList = await response.json();

    //// отрисовываем в DOM - дерево список согласно полученого ответа
    todoItemList.forEach(todoItem => {
      const todoItemElement = createTodoItemElement(todoItem, handlers);
      todoList.append(todoItemElement)
    });

    //браузер создаёт событие submit на форме по нажатию на Enter или на кнопку создания дела
    todoItemForm.form.addEventListener('submit', async e => {
      // эта строчка необходима, чтобы предотвратить стандартное действия браузера
      // в данном случае мы не хотим, чтобы страница перезагружалась при отправке формы
      e.preventDefault();

      // игнорируем создание элемента, если пользователь ничего не ввёл в поле
      if (!todoItemForm.input.value) {
        return;
      }
      ////запрос создание дела на сервеpe 
      const response = await fetch('http://localhost:3000/api/todos', {
        method: 'POST',
        body: JSON.stringify({
          name: todoItemForm.input.value.trim(), //// поле для ввода задания
          owner,
        }),
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const todoItem = await response.json(); //// получаем тело ответа задания
      const todoItemElement = createTodoItemElement(todoItem, handlers);

      // создаём и добавляем в список новое дело с названием из поля для ввода
      todoList.append(todoItemElement);

      //обнуляем значение в поле, чтобы не пришлось стирать его вручную
      todoItemForm.input.value = '';
    });
  }

  window.createTodoApp = createTodoApp;
})();

