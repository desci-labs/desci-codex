import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { motion, AnimatePresence } from "motion/react";
import { PageContainer } from "./layout/PageContainer";
import { ExternalLink } from "@/components/ui/external-link";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqItems: FAQItem[] = [
    {
      question: "What is the Codex Network?",
      answer: (
        <>
          <p>
            The Codex Network is a peer-to-peer public infrastructure designed
            for decentralised scientific publishing. It enables researchers and
            institutions to share, verify, and preserve scientific knowledge
            without relying on centralised intermediaries.
          </p>
          <br />
          <p>
            The entire system is open and permissionless, with cryptographic
            signatures ensuring author identity when a work is updated.
          </p>
          <br />
          <p>
            A publication can contain arbitrary data. This is structured as a
            file system and resolved over IPFS. This means resolution of
            research artefacts can be done regardless of where the data happens
            to be physically located, and who happens to be serving it.
          </p>
        </>
      ),
    },
    {
      question: "What is this app?",
      answer: (
        <>
          <p>
            This application provides a technical overview of the Codex Network,
            displaying real-time information about network health, active nodes,
            and known streams, events, and publication manifests. It serves as a
            monitoring dashboard for understanding the current state and
            activity of the network.
          </p>
          <br />
          <p>
            The Network Status App is not suitable for peering into the content
            of publications. Its purpose is to provide transparency into the
            underlying infrastructure, and the raw, protocol-level resources
            being synced between the nodes in the network.
          </p>
        </>
      ),
    },
    {
      question: "Where can I interact with publications?",
      answer: (
        <p>
          You can explore and interact with publications using these portals:{" "}
          <ExternalLink href="https://nodes.desci.com/browse">
            DeSci Publish
          </ExternalLink>{" "}
          provides a comprehensive interface for browsing and publishing
          content, while the{" "}
          <ExternalLink href="https://dpid.org/browse">
            dPID Indexer
          </ExternalLink>{" "}
          offers specialised tools for discovering and referencing persistent
          identifiers built on Codex.
        </p>
      ),
    },
    {
      question: "What is dPID, and how is it connected to Codex?",
      answer: (
        <p>
          dPID (decentralised Persistent Identifier) is a system for creating
          permanent, verifiable references to scientific content. The Codex
          Network serves as the underlying public infrastructure that powers the
          dPID system, ensuring data persistence and accessibility. Learn more
          at <ExternalLink href="https://dpid.org">dpid.org</ExternalLink>.
        </p>
      ),
    },
    {
      question: "How can I support or integrate the Codex Network?",
      answer: (
        <p>
          For more information about how to interact with the Codex Network,
          visit the{" "}
          <ExternalLink href="https://codex.desci.com/readme/quick-start">
            Quick Start Guide
          </ExternalLink>
          , which provides comprehensive instructions for running nodes,
          programmatically interacting with hosted content, and other technical
          integrations.
        </p>
      ),
    },
    {
      question: "Is Codex open source?",
      answer: (
        <p>
          Yes, the Codex Network is fully open source and licensed under the MIT
          License. You can explore the codebase, contribute, fork, or deploy
          your own instances by visiting the{" "}
          <ExternalLink href="https://github.com/desci-labs/desci-codex">
            GitHub repository
          </ExternalLink>
          .
        </p>
      ),
    },
    {
      question: "Where can I learn more?",
      answer: (
        <p>
          For more comprehensive technical documentation, visit{" "}
          <ExternalLink href="https://codex.desci.com">
            codex.desci.com
          </ExternalLink>
          . Join our community on{" "}
          <ExternalLink href="https://discord.com/invite/A5P9fgB5Cf">
            Discord
          </ExternalLink>{" "}
          to connect with the core team, external developers, researchers, and
          other network participants.
        </p>
      ),
    },
    {
      question: "How is the Codex Network built?",
      answer: (
        <>
          <p>
            Each publication is encoded as a JSON manifest, containing metadata
            and IPFS references for the content. These manifests are versioned
            in a stream, consisting of a series of events (or updates). A git
            branch is a helpful analogy. Streams and events are primitives of{" "}
            <ExternalLink href="https://ceramic.network/how-it-works">
              Ceramic
            </ExternalLink>
            , which is how Codex manages discovery and indexing of new content.
          </p>
          <br />
          <p>
            A full Codex Node consists of a preconfigured Ceramic daemon running
            together with the Codex service. The latter listens to the gossip
            discovered by the Ceramic node, digs through the manifest for IPFS
            resources, and makes them available peer-to-peer using a built-in{" "}
            <ExternalLink href="https://helia.io/">Helia</ExternalLink> IPFS
            instance.
          </p>
        </>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Frequently Asked Questions"
        description="Learn about the Codex Network, how to participate, and where to find resources."
        showNetworkStatus={false}
      />

      <PageContainer>
        {faqItems.map((item, index) => {
          const isOpen = openIndex === index;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                ease: "easeOut",
                delay: 0.15 + index * 0.05,
              }}
            >
              <Card className="overflow-hidden">
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full p-6 text-left hover:bg-accent/50 transition-colors focus:outline-none"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold pr-4">
                      {item.question}
                    </h3>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-shrink-0"
                    >
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    </motion.div>
                  </div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-answer-${index}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 text-muted-foreground leading-relaxed">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </PageContainer>
    </>
  );
}
