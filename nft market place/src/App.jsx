import { useState } from "react";
import Home from "./Components/Home";
import { Route, Routes } from "react-router-dom";
import Sell from "./Components/Sell";
import NavBar from "./Components/NavBar";
import Mint from "./Components/Mint";

export default function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="sell" element={<Sell />}></Route>
        <Route path="mint" element={<Mint />}></Route>
      </Routes>
    </>
  );
}