import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Todo, TodoInput, TodoStatus } from "@/types/todo";
import { toast } from "@/lib/toast-wrapper";
import { useAuth } from "@/lib/auth";

function mapRow(row: any): Todo {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    category: row.category,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useTodos() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load to-do list");
      setIsLoading(false);
      return;
    }
    setTodos((data ?? []).map(mapRow));
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createTodo = async (input: TodoInput) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("todos")
      .insert({
        user_id: user.id,
        title: input.title,
        description: input.description ?? null,
        status: input.status,
        priority: input.priority,
        due_date: input.dueDate ?? null,
        category: input.category ?? null,
        completed_at: input.status === "done" ? new Date().toISOString() : null,
      })
      .select()
      .single();
    if (error) {
      toast.error("Failed to create to-do");
      return null;
    }
    const todo = mapRow(data);
    setTodos((prev) => [todo, ...prev]);
    toast.success("To-do created");
    return todo;
  };

  const updateTodo = async (id: string, patch: Partial<TodoInput>) => {
    const update: any = {};
    if (patch.title !== undefined) update.title = patch.title;
    if (patch.description !== undefined) update.description = patch.description;
    if (patch.status !== undefined) {
      update.status = patch.status;
      update.completed_at = patch.status === "done" ? new Date().toISOString() : null;
    }
    if (patch.priority !== undefined) update.priority = patch.priority;
    if (patch.dueDate !== undefined) update.due_date = patch.dueDate;
    if (patch.category !== undefined) update.category = patch.category;

    const { data, error } = await supabase
      .from("todos")
      .update(update)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      toast.error("Failed to update to-do");
      return null;
    }
    const todo = mapRow(data);
    setTodos((prev) => prev.map((t) => (t.id === id ? todo : t)));
    return todo;
  };

  const moveStatus = async (id: string, status: TodoStatus) => {
    return updateTodo(id, { status });
  };

  const deleteTodo = async (id: string) => {
    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete to-do");
      return;
    }
    setTodos((prev) => prev.filter((t) => t.id !== id));
    toast.success("To-do deleted");
  };

  return { todos, isLoading, refresh, createTodo, updateTodo, moveStatus, deleteTodo };
}
