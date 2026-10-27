export const KINDS = {
  message: { label: "Message", icon: "💬" },
  task: { label: "Task", icon: "📌" },
  todo: { label: "To-do", icon: "✅" },
  punishment: { label: "Punishment", icon: "⚠️" },
  reward: { label: "Reward", icon: "🏆" },
};

// Kinds the player can mark as done
export const ACTION_KINDS = ["task", "todo", "punishment"];

export const FEEDBACK_KINDS = {
  suggestion: { label: "Suggestion", icon: "💡" },
  message: { label: "Message", icon: "💬" },
  problem: { label: "Problem", icon: "🚩" },
};

export const FEEDBACK_STATUS = {
  new: { label: "New", style: "bg-red-900 text-red-300" },
  reviewed: { label: "👀 Reviewed", style: "bg-blue-900 text-blue-300" },
  planned: { label: "📅 Planned", style: "bg-green-900 text-green-300" },
  declined: { label: "Not for now", style: "bg-neutral-700 text-neutral-300" },
};