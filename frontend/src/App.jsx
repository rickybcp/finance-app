import TransactionForm from "./components/TransactionForm.jsx";

function App() {
  // Fonction appelée lorsque la transaction est ajoutée
  const handleTransactionAdded = () => {
    console.log("Transaction ajoutée avec succès !");
    // Vous pouvez ajouter ici des actions supplémentaires, comme rafraîchir une liste
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gestion des finances</h1>
      {/* Passez la fonction handleTransactionAdded comme prop */}
      <TransactionForm onTransactionAdded={handleTransactionAdded} />
    </div>
  );
}

export default App;
