import React, { useEffect, useState } from "react";
import * as ReactDOMClient from 'react-dom/client';
import ReactMarkdown from 'react-markdown';
import { Card, createTheme, Loading, NextUIProvider, Spacer, Text } from "@nextui-org/react";
import { ApiPromise, WsProvider } from "@polkadot/api";
import type { DeriveReferendumExt } from '@polkadot/api-derive/types';
import { pop } from "./utils";
import { fetchReferendum, Post } from "./utils/polkassembly";
import { getAllReferendums } from "./utils/democracy";
import { SwipeableCard } from "./components/card";

function ReferendumCard({ referendum }: { referendum: DeriveReferendumExt }): JSX.Element {
  const [details, setDetails] = useState<Post>();

  useEffect(() => {
    async function fetchData() {
      const details = await fetchReferendum(referendum.index.toNumber());
      setDetails(details.posts[0]);
    }
    fetchData();
  }, []);

  return <CardElement index={referendum.index.toNumber()} title={details?.title || ""} details={details?.content || ""} />;
}

function CardElement({ index, title, details }: { index: number, title: string, details: string }): JSX.Element {
  const isHTML = details.startsWith("<p>"); // A bug in polkascan made some posts in HTML. They should always be markdown.
  return (
    <Card className="card">
      <Card.Header>
        <Text h3 color="#e6007a" css={{ p: "$8" }}>#{index} {title}</Text>
      </Card.Header>
      <Card.Divider />
      <Card.Body css={{ p: "$12", overflowX: "clip" }}>
        {isHTML
        ? <Text dangerouslySetInnerHTML={{__html: details}} />
        : <ReactMarkdown>{details}</ReactMarkdown>}
      </Card.Body>
      <Card.Divider />
    </Card>
  );
}

export default function VotesTable({ votes }: { votes: Vote[] }) {
  return (
    <div>
    {votes.map(vote => {
      const color = vote.vote ? "success" : "warning";
      return (
        <>
          <Card isHoverable variant="bordered" css={{ mw: "400px" }}>
            <Card.Body style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
              <Text h3 b >#{vote.referendum.index.toHuman()}</Text>
              <Spacer y={2} />
              <Text h4 color={color}>{vote.vote ? "Aye" : "Naye"}</Text>
            </Card.Body>
          </Card>
          <Spacer x={1} />
        </>);
    })}
    </div>
  );
}

type Vote = {
  index: number,
  vote: boolean,
  referendum: DeriveReferendumExt
}

function App() {
  const [referendums, setReferendums] = useState<Array<DeriveReferendumExt> | undefined>();
  const [votes, setVotes] = useState<Array<Vote>>([]);

  useEffect(() => {
    async function fetchData() {
      const wsProvider = new WsProvider("wss://rpc.polkadot.io");
      const api = await ApiPromise.create({ provider: wsProvider });
      const referendums = await getAllReferendums(api);
      setReferendums(referendums);
    }
    fetchData();
  }, []);

  function onSwipe(idx: number, vote: boolean, referendum: DeriveReferendumExt) {
    setVotes([...votes, {index: idx, vote: vote, referendum: referendum}])
    setReferendums(referendums && pop(referendums));
  }

  return (
    <>
      <div style={{display: "flex", flex: 1, alignItems: "center", justifyContent:"center"}}>
        {(referendums && referendums.length > 0) && referendums.map((referendum, idx) => {
          return (
            <SwipeableCard key={idx} onVote={(vote: boolean) => onSwipe(idx, vote, referendum)} drag={true}>
              <ReferendumCard referendum={referendum} />
            </SwipeableCard>
          );
        })}
        {(referendums?.length == 0) && 
        <VotesTable votes={votes} />}
        {!referendums && 
        <div style={{display: "flex", flexDirection: "column"}}>
          <Loading />
          <Spacer y={2} />
          <Text
            h1
            size={60}
            color="#e6007a"
            css={{
              textAlign: "center"
            }}
            weight="bold">Get ready to vote!</Text>
        </div>}
      </div>
    </>
  );
}

const theme = createTheme({
  type: "light",
  theme: {
    fonts: {
      sans: 'Unbounded',
    }
  }
})

const container = document.getElementById('root');
if (container) {
  const root = ReactDOMClient.createRoot(container);
  root.render(
    <React.StrictMode>
      <NextUIProvider theme={theme}>
        <main style={{display: "flex", flexDirection: "column", height: "100vh", alignItems: "center"}}>
          <App />
        </main>
      </NextUIProvider>
    </React.StrictMode>
  );
}