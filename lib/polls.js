import db from "@/lib/db";
import { nowInJinzhou } from "@/lib/format";

// Returns every poll with its options, counts, and (for the captain) who voted what.
export function getPolls(userId = null, { withVoters = false } = {}) {
  const now = nowInJinzhou();

  const polls = db.prepare("SELECT * FROM polls ORDER BY id DESC").all();
  const options = db.prepare("SELECT * FROM poll_options ORDER BY position, id").all();
  const votes = db
    .prepare(
      `SELECT v.poll_id, v.user_id, v.option_id, p.number, p.name, u.username
       FROM poll_votes v
       JOIN users u ON u.id = v.user_id
       LEFT JOIN players p ON p.id = u.player_id`
    )
    .all();
  const people = db
    .prepare(
      `SELECT u.id, p.number, p.name, u.username
       FROM users u LEFT JOIN players p ON p.id = u.player_id`
    )
    .all();

  const display = (v) => (v.name ? `${v.number} ${v.name}` : v.username);

  return polls.map((poll) => {
    const closed = poll.closed === 1 || Boolean(poll.closes_at && poll.closes_at < now);
    const pollVotes = votes.filter((v) => v.poll_id === poll.id);

    const opts = options
      .filter((o) => o.poll_id === poll.id)
      .map((o) => {
        const forThis = pollVotes.filter((v) => v.option_id === o.id);
        return {
          ...o,
          count: forThis.length,
          voters: withVoters ? forThis.map(display) : [],
        };
      });

    const mine = userId ? pollVotes.find((v) => v.user_id === userId) : null;
    const voted = new Set(pollVotes.map((v) => v.user_id));
    const notVoted = withVoters
      ? people.filter((p) => !voted.has(p.id)).map(display)
      : [];

    return {
      ...poll,
      closed,
      options: opts,
      total: pollVotes.length,
      myVote: mine?.option_id ?? null,
      notVoted,
    };
  });
}