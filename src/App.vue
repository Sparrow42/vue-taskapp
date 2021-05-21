<template>
  <div>
    <h1>Vue-TypeScript-TODOリスト</h1>
    <label v-for="[state, text] in Array.from(labels)" :key="state">
      <input type="radio" v-model="current" :value="state">
      {{ text }}
    </label>
    {{ filteredTodos.length }} 件を表示中<button type="button" v-on:click='removeSelectTodo'>削除</button>
    <select v-model='order' v-on:change='sortTodo'>
      <option hidden>Please select order key</option>
      <option value="deadline">期限</option>
      <option value="priority">優先度</option>
    </select>
    <table>
      <thead>
        <tr>
          <th class="id">ID</th>
          <th class="comment">タスク内容</th>
          <th class="state">状態</th>
          <th class="button">-</th>
          <th class="deadline">期限</th>
          <th class="priority">優先度</th>
          <th class="select">選択</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(todo, index) in filteredTodos" 
          :key="todo.id" 
          draggable 
          @dragstart="dragList($event, index)"
          @drop="dropList($event, index)"
          @dragover.prevent
          @dragenter.prevent
        >

          <th>{{ todo.id }}</th>
          <td>{{ todo.name }}</td>
          <td class="state">
            <button @click="toggleState(todo)">
              {{ labels.get(todo.state) }}
            </button>
          </td>
          <td class="button">
            <button @click.shift="removeTodo(todo)">
              削除
            </button>
          </td>
          <td class="deadline">
            {{ dateToString(todo.deadline) }}
          </td>
          <td class="priority">
            {{ priorityRelation[todo.priority] }}
          </td>
          <td class="select">
            <input type="checkbox" v-model="todo.select" >
          </td>
        </tr>
      </tbody>
    </table>

    <p>
      ※削除ボタンはコントロールキーを押しながらクリックして下さい
    </p>

    <h2>新しい作業の追加</h2>
    <form class="add-item" @submit.prevent="addTodo">
      タスク内容： <input type="text" ref="name">
      期限：<input type="date" ref="deadline">
      優先度：<select ref="priority">
        <option value="">Please select priorty</option>
        <option value="3">高</option>
        <option value="2">中</option>
        <option value="1">低</option>
      </select>
      <button type="submit">追加</button>
    </form>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import TodoStorage from '@/todoStorage';
import { State, TodoItem } from '@/todoItem';

const todoStorage = new TodoStorage()

@Component
export default class App extends Vue {
  private todos: TodoItem[] = []

  // todo: オプションの選択肢もここを参照する
  private priorityRelation = {
    3: '高',
    2: '中',
    1: '低'
  }

  private order: string = '';

  private labels = new Map<State, string>([
    [State.All, '全て'],
    [State.Working, '作業中'],
    [State.Done, '完了']
  ])

  private current: State = State.All

  private get filteredTodos() {
    return this.todos.filter(t =>
      this.current === State.All ? true : this.current === t.state)
  }

  private created() {
    this.todos = todoStorage.fetchAll()
  }

  private addTodo() {
    const name = this.$refs.name as HTMLInputElement
    const priority = this.$refs.priority as HTMLInputElement
    const deadline = this.$refs.deadline as HTMLInputElement
    if (!name.value.length) {
      return
    }
    
    this.todos.push({
      id: todoStorage.nextId, 
      name: name.value, 
      state: State.Working, 
      deadline: new Date(deadline.value),
      priority: priority.value,
      select: false
    })
    name.value = ''
    priority.value = ''
    deadline.value = ''
  }

  private removeTodo(todo: TodoItem) {
    const index = this.todos.indexOf(todo)
    this.todos.splice(index, 1)
  }

  private removeSelectTodo() {
      this.todos = this.todos.filter((value, index) => {
        return !value.select;
      });   
  }

  private sortTodo() {
    if(!this.order){
      return;
    }
    console.log('sort: ', this.todos);
    
    this.todos.sort((a, b) => {
      if(this.order === 'deadline'){
        // todo: null時のアルゴリズムを確認する
        // console.log('a:', a.deadline, 'b:', b.deadline);
        if(a.deadline === null) return 1;
        return b.deadline === null ? -1 : (new Date(a.deadline) < new Date(b.deadline) ? -1 : 1);
      }else if(this.order === 'priority'){
        return a.priority > b.priority ? -1 : 1;
      }else {
        return 0;
      }
    });

    
  }

  private toggleState(todo: TodoItem) {
    todo.state = todo.state === State.Working ? State.Done : State.Working
  }

  private dateToString(date: Date):String {
    if(date === null) return '';
    date = new Date(date); //date型じゃない？？
    const month = date.getMonth() + 1;
    return month + '/' + date.getDate();
  }

  @Watch('todos', { deep: true })
  private onTodoChanged(todos: TodoItem[]) {
    todoStorage.save(todos)
  }

  private dragList(event: any, dragIndex: number) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.dropEffect = 'move'
    event.dataTransfer.setData('drag-index',dragIndex)
  }

  private dropList(event: any, dropIndex: number) {
    const dragIndex = event.dataTransfer.getData('drag-index')
    const deleteList = this.todos.splice(dragIndex, 1);
    this.todos.splice(dropIndex, 0, deleteList[0])
  }
}
</script>

<style>
* {
  box-sizing: border-box;
}

#app {
  max-width: 640px;
  margin: 0 auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead th {
  border-bottom: 2px solid #0099e4; /*#d31c4a */
  color: #0099e4;
}

th,
th {
  padding: 0 8px;
  line-height: 40px;
}

thead th.id {
  width: 50px;
}

thead th.state {
  width: 100px;
}

thead th.button {
  width: 60px;
}

tbody td.button, tbody td.state {
  text-align: center;
}

tbody tr td,
tbody tr th {
  border-bottom: 1px solid #ccc;
  transition: All 0.4s;
}

tbody tr.Done td,
tbody tr.Done th {
  background: #f8f8f8;
  color: #bbb;
}

tbody tr:hover td,
tbody tr:hover th {
  background: #f4fbff;
}

button {
  border: none;
  border-radius: 20px;
  line-height: 24px;
  padding: 0 8px;
  background: #0099e4;
  color: #fff;
  cursor: pointer;
}
</style>
