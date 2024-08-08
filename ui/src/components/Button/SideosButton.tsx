import { Button, ButtonProps } from "react-daisyui";

interface SideosButton extends ButtonProps {
  jwt: string;
}
const SideosButton: React.FC<SideosButton> = ({ jwt, children, ...rest }) => {
  return (
    <Button
      id="dawRequestCredential"
      tab-index="0"
      type="button"
      data-jwt={jwt}
      {...rest}
    >
      {children}
    </Button>
  );
};

export default SideosButton;
