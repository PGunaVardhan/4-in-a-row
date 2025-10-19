import React, { useState, useEffect } from 'react';
import './Leaderboard.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/leaderboard`);
      const data = await response.json();
      setLeaderboard(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      setLoading(false);
    }
  };

  return (
    <div className="leaderboard">
      <h2>🏆 Leaderboard</h2>
      {loading ? (
        <p>Loading...</p>
      ) : leaderboard.length === 0 ? (
        <p>No games played yet</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Wins</th>
              <th>Games</th>
              <th>Win Rate</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((player, index) => (
              <tr key={player.username}>
                <td>{index + 1}</td>
                <td>{player.username}</td>
                <td>{player.wins}</td>
                <td>{player.games_played}</td>
                <td>{player.win_rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Leaderboard;