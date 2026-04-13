declare module "actioncable" {
  const ActionCable: {
    createConsumer(url: string): unknown;
  };
  export default ActionCable;
}
