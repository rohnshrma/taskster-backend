import { Todo } from "../models/Todo.js";

export const getTodos = async (_req, res) => {
  const todos = await Todo.find().sort({ createdAt: -1 });
  res.status(200).json(todos);
};

export const createTodo = async (req, res) => {
  const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: "Title is required." });
  }

  const todo = await Todo.create({ title: title.trim() });
  res.status(201).json(todo);
};

export const updateTodo = async (req, res) => {
  const { id } = req.params;
  const { title, completed } = req.body;

  const updateData = {};

  if (typeof title === "string") {
    if (!title.trim()) {
      return res.status(400).json({ message: "Title cannot be empty." });
    }

    updateData.title = title.trim();
  }

  if (typeof completed === "boolean") {
    updateData.completed = completed;
  }

  const todo = await Todo.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  });

  if (!todo) {
    return res.status(404).json({ message: "Todo not found." });
  }

  res.status(200).json(todo);
};

export const deleteTodo = async (req, res) => {
  const { id } = req.params;

  const todo = await Todo.findByIdAndDelete(id);

  if (!todo) {
    return res.status(404).json({ message: "Todo not found." });
  }

  res.status(200).json({ message: "Todo deleted." });
};
