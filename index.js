const pg = require('pg')
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_notes_db')
const express = require('express')
const app = express()

app.use(express.json())
app.use(require('morgan')('dev'))



// Define routes for notes (existing functionality)
app.post('/api/notes', async (req, res, next) => {
  try {
    const { txt, ranking } = req.body;
    const SQL = `INSERT INTO notes (txt, ranking) 
                VALUES ($1, $2) 
                RETURNING *
                `
    const response = await client.query(SQL, [txt, ranking]);
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

app.get('/api/notes', async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM notes ORDER BY created_at DESC`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

app.put('/api/notes/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { txt, ranking } = req.body;
    const SQL = `UPDATE notes SET txt=$1, ranking=$2, updated_at=now() WHERE id=$3 RETURNING *`;
    const response = await client.query(SQL, [txt, ranking, id]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/notes/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const SQL = `DELETE FROM notes WHERE id=$1`;
    await client.query(SQL, [id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

// Define routes for flavors (new functionality)
app.get('/api/flavors', async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM flavors ORDER BY created_at DESC`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

app.get('/api/flavors/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const SQL = `SELECT * FROM flavors WHERE id=$1`;
    const response = await client.query(SQL, [id]);
    if (response.rows.length === 0) {
      res.sendStatus(404);
    } else {
      res.send(response.rows[0]);
    }
  } catch (error) {
    next(error);
  }
});

app.post('/api/flavors', async (req, res, next) => {
  try {
    const { name, is_favorite } = req.body;
    const SQL = `INSERT INTO flavors (name, is_favorite) VALUES ($1, $2) RETURNING *`;
    const response = await client.query(SQL, [name, is_favorite]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/flavors/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const SQL = `DELETE FROM flavors WHERE id=$1`;
    await client.query(SQL, [id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

app.put('/api/flavors/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, is_favorite } = req.body;
    const SQL = `
      UPDATE flavors
      SET name=$1, is_favorite=$2, updated_at=now()
      WHERE id=$3 RETURNING *`;
    const response = await client.query(SQL, [name, is_favorite, id]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Start the initialization process and start the server
const init = async () => {
  try {
    await client.connect();
    console.log('connected to database');

    let SQL = `
      DROP TABLE IF EXISTS notes;
      CREATE TABLE notes (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        ranking INTEGER DEFAULT 3 NOT NULL,
        txt VARCHAR(255) NOT NULL
      );
    `;

    await client.query(SQL);
    console.log('notes table created');

    SQL = `
      INSERT INTO notes (txt, ranking) VALUES
      ('First Note', 5),
      ('Second Note', 3),
      ('Third Note', 1);
    `;

    await client.query(SQL);
    console.log('notes data seeded');

    SQL = `
      DROP TABLE IF EXISTS flavors;
      CREATE TABLE flavors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        is_favorite BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `;

    await client.query(SQL);
    console.log('flavors table created');

    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`listening on port ${port}`));
  } catch (err) {
    console.error('Error initializing the database:', err);
  }
};

init();
