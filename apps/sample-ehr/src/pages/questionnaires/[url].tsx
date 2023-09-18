import { MainPage } from "@/components";
import { QuestionnaireResponse } from "@bonfhir/core/r4b";
import { FhirQuestionnaire } from "@bonfhir/react/r4b";
import { Paper, Stack } from "@mantine/core";
import { Prism } from "@mantine/prism";
import { useRouter } from "next/router";
import { useState } from "react";

export default function QuestionnairePage() {
  const router = useRouter();
  const { url } = router.query as { url: string | undefined };
  const [questionnaireResponse, setQuestionnaireResponse] = useState<
    QuestionnaireResponse | undefined
  >(undefined);

  return (
    <MainPage>
      <Paper>
        <Stack>
          <FhirQuestionnaire
            source={url}
            onSubmit={setQuestionnaireResponse}
            onCancel={() => router.push("/")}
            rendererProps={{ mainStack: { w: "50%" } }}
          />
          <Prism language="json">
            {JSON.stringify(questionnaireResponse, undefined, 2) || ""}
          </Prism>
        </Stack>
      </Paper>
    </MainPage>
  );
}
