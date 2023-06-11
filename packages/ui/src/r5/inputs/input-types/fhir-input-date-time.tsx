import { ReactElement } from "react";
import { useFhirUIContext } from "../../context.js";
import { FhirInputCommonProps } from "./common.js";

export interface FhirInputDateTimeProps<TRendererProps = any>
  extends FhirInputCommonProps {
  type: "dateTime";
  placeholder?: string | null | undefined;
  value?: string | null | undefined;
  onChange?: (value: string | undefined) => void;
  rendererProps?: TRendererProps;
}

export function FhirInputDateTime<TRendererProps = any>(
  props: FhirInputDateTimeProps<TRendererProps>
): ReactElement | null {
  const { render } = useFhirUIContext();

  return render("FhirInputDateTime", { ...props });
}

export type FhirInputDateTimeRendererProps<TRendererProps = any> =
  FhirInputDateTimeProps<TRendererProps>;

export type FhirInputDateTimeRenderer = (
  props: FhirInputDateTimeRendererProps
) => ReactElement | null;
